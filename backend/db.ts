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
  status: { 
    type: String, 
    enum: ['waiting', 'notified', 'pending_verification', 'nearby', 'in-progress', 'completed', 'no-show'], 
    default: 'waiting' 
  },
  estimatedWaitTime: { type: Number }, // in minutes, matches schema.ts
  timestamp: { type: Date, default: Date.now }, // matches schema.ts field name
  // New fields for queue management
  notifiedAt: { type: Date },
  notificationMinutes: { type: Number }, // How many minutes user was given (5, 10, 15, 20)
  checkInAttemptedAt: { type: Date },
  checkInLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  checkInDistance: { type: Number }, // meters from salon
  verifiedAt: { type: Date },
  verificationMethod: { type: String, enum: ['gps_auto', 'manual', 'admin_override'] },
  verifiedBy: { type: String }, // admin user ID if manual
  serviceStartedAt: { type: Date },
  serviceCompletedAt: { type: Date },
  noShowMarkedAt: { type: Date },
  noShowReason: { type: String },
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
  category: { type: String, enum: ['interior', 'reception', 'services', 'exterior'], default: 'interior' },
  createdAt: { type: Date, default: Date.now }
});

// User Reputation Schema
const userReputationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
  totalCheckIns: { type: Number, default: 0 },
  successfulCheckIns: { type: Number, default: 0 },
  falseCheckIns: { type: Number, default: 0 }, // Admin rejected
  noShows: { type: Number, default: 0 },
  completedServices: { type: Number, default: 0 },
  reputationScore: { type: Number, default: 50, min: 0, max: 100 }, // 0-100
  trustLevel: { 
    type: String, 
    enum: ['new', 'regular', 'trusted', 'suspicious', 'banned'], 
    default: 'new' 
  },
  lastCheckInAt: { type: Date },
  lastNoShowAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Check-In Log Schema
const checkInLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  queueId: { type: String, required: true },
  salonId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Location data
  userLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  salonLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  distance: { type: Number }, // meters
  // Verification details
  method: { 
    type: String, 
    enum: ['gps_auto', 'manual', 'admin_override'], 
    required: true 
  },
  autoApproved: { type: Boolean, required: true },
  requiresConfirmation: { type: Boolean, required: true },
  verifiedBy: { type: String }, // admin user ID
  // Result
  success: { type: Boolean, required: true },
  reason: { type: String }, // If failed or flagged
  // Pattern detection flags
  suspicious: { type: Boolean, default: false },
  suspiciousReasons: { type: [String], default: [] },
  // Timing
  timeSinceNotification: { type: Number } // milliseconds
});

// Notification Log Schema
const notificationLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  queueId: { type: String, required: true },
  salonId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Notification details
  type: { 
    type: String, 
    enum: [
      'queue_notification', 
      'arrival_verified', 
      'service_starting', 
      'service_completed', 
      'no_show',
      'position_update'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  // Delivery channels
  channels: {
    whatsapp: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    websocket: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false } // User was connected
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    }
  },
  // User interaction
  viewed: { type: Boolean, default: false },
  viewedAt: { type: Date },
  actionTaken: { type: String }, // e.g., "accepted", "dismissed"
  actionTakenAt: { type: Date }
});

// Create indexes for optimal query performance
queueSchema.index({ salonId: 1, status: 1 });
queueSchema.index({ userId: 1, status: 1 });
queueSchema.index({ status: 1, notifiedAt: 1 });
queueSchema.index({ salonId: 1, position: 1 });

userReputationSchema.index({ userId: 1 }, { unique: true });
userReputationSchema.index({ trustLevel: 1 });
userReputationSchema.index({ reputationScore: 1 });

checkInLogSchema.index({ userId: 1, timestamp: -1 });
checkInLogSchema.index({ queueId: 1 });
checkInLogSchema.index({ salonId: 1, timestamp: -1 });
checkInLogSchema.index({ suspicious: 1 });

notificationLogSchema.index({ userId: 1, timestamp: -1 });
notificationLogSchema.index({ queueId: 1 });
notificationLogSchema.index({ salonId: 1, timestamp: -1 });
notificationLogSchema.index({ type: 1 });

// Create models
export const UserModel = mongoose.model('User', userSchema);
export const SalonModel = mongoose.model('Salon', salonSchema);
export const ServiceModel = mongoose.model('Service', serviceSchema);
export const QueueModel = mongoose.model('Queue', queueSchema);
export const OfferModel = mongoose.model('Offer', offerSchema);
export const ReviewModel = mongoose.model('Review', reviewSchema);
export const SalonPhotoModel = mongoose.model('SalonPhoto', salonPhotoSchema);
export const UserReputationModel = mongoose.model('UserReputation', userReputationSchema);
export const CheckInLogModel = mongoose.model('CheckInLog', checkInLogSchema);
export const NotificationLogModel = mongoose.model('NotificationLog', notificationLogSchema);