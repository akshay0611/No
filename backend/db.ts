import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartq';

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
    
    // Fix phone index to be sparse (allows multiple null values)
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'users' }).toArray();
      
      if (collections.length > 0) {
        // Drop the old non-sparse phone index if it exists
        try {
          await db.collection('users').dropIndex('phone_1');
          console.log('Dropped old phone index');
        } catch (err: any) {
          // Index might not exist or already dropped
          if (err.code !== 27) { // 27 = IndexNotFound
            console.log('Phone index does not exist or already dropped');
          }
        }
        
        // Create new sparse index
        await db.collection('users').createIndex(
          { phone: 1 },
          { unique: true, sparse: true }
        );
        console.log('Created sparse phone index');
      }
    } catch (indexError) {
      console.log('Index management info:', indexError);
      // Don't fail the connection if index management fails
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define schemas
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String }, // Made optional for phone auth
  email: { type: String, unique: true, sparse: true }, // Made optional and sparse
  phone: { type: String, unique: true, sparse: true },
  password: { type: String }, // Made optional for phone auth
  role: { type: String, required: true, default: 'customer', enum: ['customer', 'salon_owner'] },
  location: { type: String },
  bio: { type: String },
  profileImage: { type: String },
  loyaltyPoints: { type: Number, default: 0 },
  salonLoyaltyPoints: { type: Map, of: Number, default: {} },
  favoriteSalons: { type: [String], default: [] },
  // Verification fields
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailOTP: { type: String },
  phoneOTP: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const salonSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  manualLocation: { type: String, default: '' },
  type: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  description: { type: String },
  imageUrl: { type: String },
  contactNumber: { type: String },
  openingHours: { type: String },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const queueSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  userId: { type: String, required: true },
  serviceIds: { type: [String], required: true }, 
  totalPrice: { type: Number, required: true }, 
  appliedOffers: { type: [String], default: [] }, 
  position: { type: Number, required: true },
  status: { type: String, enum: ['waiting', 'in-progress', 'completed', 'no-show'], default: 'waiting' },
  estimatedWaitTime: { type: Number }, // in minutes, matches schema.ts
  timestamp: { type: Date, default: Date.now }, // matches schema.ts field name
  createdAt: { type: Date, default: Date.now }
});

const offerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  discount: { type: Number, required: true }, // stays a number
  validityPeriod: { type: Date, required: true }, // proper date
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});


const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const salonPhotoSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  salonId: { type: String, required: true },
  url: { type: String, required: true },
  publicId: { type: String, required: true }, // Cloudinary public_id for deletion
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const UserModel = mongoose.model('User', userSchema);
export const SalonModel = mongoose.model('Salon', salonSchema);
export const ServiceModel = mongoose.model('Service', serviceSchema);
export const QueueModel = mongoose.model('Queue', queueSchema);
export const OfferModel = mongoose.model('Offer', offerSchema);
export const ReviewModel = mongoose.model('Review', reviewSchema);
export const SalonPhotoModel = mongoose.model('SalonPhoto', salonPhotoSchema);