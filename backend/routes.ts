import type { Express } from "express";
import { z } from 'zod';
import multer from 'multer';

import { createServer, type Server } from "http";
import { MongoStorage } from "./mongoStorage";
import {
  insertUserSchema,
  insertSalonSchema,
  insertServiceSchema,
  insertQueueSchema,
  insertOfferSchema,
  insertReviewSchema,
  insertSalonPhotoSchema,
  loginSchema,
  type Salon,
} from "./schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "./cloudinary";
import otpService from "./otpService";
import { wsManager } from "./websocket";
import dotenv from "dotenv";
import { OAuth2Client } from 'google-auth-library';
import { generateServiceDescription } from "./geminiService";
import pushRoutes from "./routes/pushRoutes";
import auditRoutes from "./routes/auditRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import healthRoutes from "./routes/healthRoutes";
import { authenticateToken } from "./middleware/auth";

// Load environment variables
dotenv.config();

// Re-export authenticateToken for backward compatibility
export { authenticateToken };

const JWT_SECRET = process.env.JWT_SECRET || "smartq-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const storage = new MongoStorage();
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});



export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Use the centralized WebSocket manager for queue updates
  const broadcastQueueUpdate = (salonId: string, queueData: any) => {
    wsManager.broadcastQueueUpdate(salonId, queueData);
  };

  // ====================
  // AUTH ROUTES
  // ====================
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create user
      const user = await storage.createUser(userData);
      
      // Update with verification fields after creation
      await storage.updateUser(user.id, {
        emailVerified: false,
        phoneVerified: false,
        isVerified: false,
      });

      // Return user data without token (no auto-login)
      const { password, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        message: 'Account created successfully. Please verify your email and phone number.'
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: error.errors });
      }
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      let user;

      if (email) {
        user = await storage.getUserByEmail(email);
      }

      if (!user) return res.status(401).json({ message: 'Invalid credentials' });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return res.status(401).json({ message: 'Invalid credentials' });

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(403).json({
          message: 'Account not verified. Please complete email and phone verification.',
          requiresVerification: true,
          userId: user.id
        });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ user: { ...user, password: undefined }, token });
    } catch (error) {
      res.status(400).json({ message: 'Invalid login data', error });
    }
  });

  app.get('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
      const { name, phone, email } = req.body;
      const userId = req.user!.userId;

      const updates: any = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (email) updates.email = email;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' });
      }

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return updated user without sensitive data
      const { password, phoneOTP, emailOTP, otpExpiry, ...userWithoutSensitiveData } = updatedUser;
      res.json(userWithoutSensitiveData);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Failed to update profile', error });
    }
  });

  // ====================
  // GOOGLE AUTHENTICATION ROUTES
  // ====================
  app.post('/api/auth/google', async (req, res) => {
    try {
      console.log('=== GOOGLE AUTH REQUEST ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const { credential, role } = req.body;

      if (!credential) {
        console.log('No credential provided');
        return res.status(400).json({ message: 'Google credential is required' });
      }

      // Validate role if provided
      const userRole = role === 'salon_owner' ? 'salon_owner' : 'customer';
      console.log('User role determined:', userRole);
      console.log('Google Client ID configured:', !!GOOGLE_CLIENT_ID);

      // Verify the Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }

      const { email, name, picture, sub: googleId } = payload;

      console.log('=== GOOGLE AUTH PAYLOAD ===');
      console.log('Email:', email);
      console.log('Name:', name);
      console.log('Picture:', picture);
      console.log('===========================');

      if (!email) {
        return res.status(400).json({ message: 'Email not provided by Google' });
      }

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      let isNewUser = false;

      if (!user) {
        // Create new user with Google data
        isNewUser = true;
        console.log('Creating new user with Google data');
        console.log('Profile picture:', picture);
        console.log('User role:', userRole);
        const userData: any = {
          name: name || '',
          email: email,
          // Don't set phone field at all - let it be undefined to avoid unique constraint issues
          password: null, // No password for Google auth
          role: userRole,
        };
        
        // Only add profileImage if it exists
        if (picture) {
          userData.profileImage = picture;
        }
        
        console.log('Creating user with data:', JSON.stringify(userData, null, 2));
        user = await storage.createUser(userData);
        console.log('User created successfully:', user?.id);
        
        // Update with verification fields after creation
        const updatedUser = await storage.updateUser(user.id, {
          emailVerified: true, // Google emails are verified
          phoneVerified: false,
          isVerified: true, // Consider Google auth as verified
        });
        user = updatedUser || user;
        console.log('Created user profileImage:', user?.profileImage);
      } else {
        // Update existing user's profile image and verification status
        console.log('Existing user found:', email);
        console.log('Existing user role:', user.role);
        console.log('Requested role:', userRole);
        console.log('Google profile picture URL:', picture);
        
        // Check for role mismatch - if existing user has different role than requested
        if (user.role !== userRole) {
          return res.status(403).json({ 
            message: `Account already exists with ${user.role} role. Cannot authenticate as ${userRole}.`,
            existingRole: user.role,
            requestedRole: userRole
          });
        }
        
        const updates: any = {
          emailVerified: true,
          isVerified: true,
        };
        
        // Always update profile image from Google if available
        if (picture) {
          updates.profileImage = picture;
          console.log('Updating profile image to:', picture);
        }
        
        await storage.updateUser(user.id, updates);
        const updatedUser = await storage.getUser(user.id);
        user = updatedUser || user;
        console.log('Updated user profileImage:', user.profileImage);
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user!.id,
          email: user!.email,
          role: user!.role || 'customer'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user data without sensitive fields
      const { password, phoneOTP, emailOTP, otpExpiry, ...userWithoutSensitiveData } = user!;

      res.json({
        user: userWithoutSensitiveData,
        token,
        isNewUser,
        message: isNewUser ? 'Account created successfully' : 'Logged in successfully'
      });

    } catch (error: any) {
      console.error('Google auth error:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      res.status(500).json({ 
        message: 'Failed to authenticate with Google', 
        error: process.env.NODE_ENV === 'development' ? error : undefined 
      });
    }
  });

  // ====================
  // PHONE AUTHENTICATION ROUTES
  // ====================

  // Rate limiting store for OTP requests
  const otpRateLimit = new Map<string, { count: number; resetTime: number }>();

  const checkRateLimit = (phoneNumber: string): boolean => {
    const now = Date.now();
    const key = phoneNumber;
    const limit = otpRateLimit.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      otpRateLimit.set(key, { count: 1, resetTime: now + 5 * 60 * 1000 }); // 5 minutes
      return true;
    }

    if (limit.count >= 3) {
      return false; // Rate limited
    }

    limit.count++;
    return true;
  };

  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Check rate limiting
      if (!checkRateLimit(phoneNumber)) {
        return res.status(429).json({
          message: 'Too many OTP requests. Please try again in 5 minutes.'
        });
      }

      let user;
      let isNewUser = false;

      // Check if this is an authenticated user trying to add phone (Google auth user)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
          // Get the authenticated user
          user = await storage.getUser(decoded.userId);
          
          if (user) {
            // Check if phone is already taken by a DIFFERENT user
            const existingPhoneUser = await storage.getUserByPhone(phoneNumber);
            if (existingPhoneUser && existingPhoneUser.id !== user.id) {
              return res.status(400).json({ 
                message: 'Phone number is already registered to another account' 
              });
            }
            // This is an existing user adding their phone - don't create new user
          }
        } catch (err) {
          // Invalid token, treat as unauthenticated
          console.log('Invalid token in send-otp, treating as new user');
        }
      }

      // If not authenticated or user not found, check if phone exists
      if (!user) {
        user = await storage.getUserByPhone(phoneNumber);
        
        if (!user) {
          // Create minimal user with just phone number (phone-only auth flow)
          isNewUser = true;
          user = await storage.createUser({
            name: '', // Will be filled later
            email: `phone-${phoneNumber}@placeholder.com`, // Generate unique placeholder email
            phone: phoneNumber,
            password: null, // No password for phone auth
            role: 'customer',
          });
          
          // Update with verification fields after creation
          const updatedUser = await storage.updateUser(user.id, {
            emailVerified: false,
            phoneVerified: false,
            isVerified: false,
          });
          user = updatedUser || user;
        }
      }

      // Generate and send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in user record
      await storage.updateUser(user.id, {
        phoneOTP: otp,
        otpExpiry: expiry,
      });

      // TODO: Send actual SMS via Twilio or other service
      console.log(`📱 OTP for ${phoneNumber}: ${otp}`);

      res.json({
        success: true,
        isNewUser,
        message: 'OTP sent successfully',
        // For testing only - remove in production
        debug: { otp }
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({ message: 'Failed to send OTP', error });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
      }

      let user;
      let isAuthenticatedUser = false;

      // Check if this is an authenticated user (Google auth user adding phone)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
          user = await storage.getUser(decoded.userId);
          isAuthenticatedUser = true;
        } catch (err) {
          // Invalid token, fall through to phone lookup
          console.log('Invalid token in verify-otp, trying phone lookup');
        }
      }

      // If not authenticated or user not found, find by phone number (phone-only auth)
      if (!user) {
        user = await storage.getUserByPhone(phoneNumber);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
      }

      // Verify OTP
      if (user.phoneOTP !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      // Check if OTP has expired
      if (!user.otpExpiry || user.otpExpiry < new Date()) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Mark phone as verified and clear OTP
      await storage.updateUser(user.id, {
        phoneVerified: true,
        isVerified: true,
        phoneOTP: null,
        otpExpiry: null,
      });

      // Generate JWT token (only for phone-only auth, not for authenticated users)
      let token = null;
      if (!isAuthenticatedUser) {
        token = jwt.sign(
          {
            userId: user.id,
            phone: user.phone,
            role: user.role || 'customer'
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
      }

      // Return user data without sensitive fields
      const { password, phoneOTP, otpExpiry, ...userWithoutSensitiveData } = user;

      const response: any = {
        user: {
          ...userWithoutSensitiveData,
          phoneVerified: true,
          isVerified: true,
        },
        message: 'Phone verified successfully'
      };

      // Only include token for phone-only auth
      if (token) {
        response.token = token;
      }

      res.json(response);

    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: 'Failed to verify OTP', error });
    }
  });

  // Profile completion endpoint for progressive user data collection
  app.put('/api/user/complete', authenticateToken, async (req, res) => {
    try {
      const { name, email, location, bio } = req.body;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({ message: 'Name is required and must be at least 2 characters' });
      }

      // Validate email if provided
      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if email is already taken by another user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== req.user!.userId) {
          return res.status(400).json({ message: 'Email is already registered to another account' });
        }
      }

      // Update user profile
      const updates: Partial<any> = {
        name: name.trim(),
      };

      if (email && email.trim()) {
        updates.email = email.trim().toLowerCase();
        updates.emailVerified = false; // Reset email verification if email changes
      }

      if (location !== undefined) {
        updates.location = location.trim();
      }

      if (bio !== undefined) {
        updates.bio = bio.trim();
      }

      const updatedUser = await storage.updateUser(req.user!.userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return updated user without sensitive data
      const { password, phoneOTP, emailOTP, otpExpiry, ...userWithoutSensitiveData } = updatedUser;

      res.json({
        user: userWithoutSensitiveData,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      console.error('Profile completion error:', error);
      res.status(500).json({ message: 'Failed to update profile', error });
    }
  });

  // Phone number update endpoint
  app.put('/api/user/phone', authenticateToken, async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone || !phone.trim()) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^\+\d{1,3}\d{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Check if phone is already taken by another user
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser && existingUser.id !== req.user!.userId) {
        // Check if the existing user is a temporary phone-only user (created during OTP send)
        const isTemporaryUser = existingUser.email?.includes('@placeholder.com') && 
                                !existingUser.name && 
                                existingUser.phone === phone;
        
        if (isTemporaryUser) {
          // Delete the temporary user since we're merging it with the Google auth user
          console.log(`Deleting temporary phone-only user ${existingUser.id} for phone ${phone}`);
          await storage.deleteUser(existingUser.id);
        } else {
          return res.status(400).json({ message: 'Phone number is already registered to another account' });
        }
      }

      // Update user phone
      const updatedUser = await storage.updateUser(req.user!.userId, {
        phone: phone.trim(),
        phoneVerified: true, // Mark as verified since they went through OTP
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Return updated user without sensitive data
      const { password, phoneOTP, emailOTP, otpExpiry, ...userWithoutSensitiveData } = updatedUser;

      res.json({
        user: userWithoutSensitiveData,
        message: 'Phone number updated successfully'
      });

    } catch (error) {
      console.error('Phone update error:', error);
      res.status(500).json({ message: 'Failed to update phone number', error });
    }
  });

  // Profile image upload endpoint
  app.post('/api/user/profile-image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Get current user to delete old image if exists
      const currentUser = await storage.getUser(req.user!.userId);

      // Delete old profile image from Cloudinary if exists
      if (currentUser?.profileImage) {
        try {
          // Extract public_id from Cloudinary URL
          // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{ext}
          const urlParts = currentUser.profileImage.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
            // Get everything after 'upload/v{version}/'
            const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
            // Remove file extension
            const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
            await deleteImageFromCloudinary(publicId);
          }
        } catch (error) {
          console.error('Error deleting old profile image:', error);
          // Continue even if deletion fails
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadImageToCloudinary(req.file.buffer, 'profile_images');

      // Update user profile with new image URL
      const updatedUser = await storage.updateUser(req.user!.userId, {
        profileImage: uploadResult.url,
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        profileImage: uploadResult.url,
        message: 'Profile image updated successfully'
      });

    } catch (error) {
      console.error('Profile image upload error:', error);
      res.status(500).json({ message: 'Failed to upload profile image', error });
    }
  });

  // Delete account endpoint
  app.delete('/api/user/account', authenticateToken, async (req, res) => {
    try {
      const { password } = req.body;

      // Get current user
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Verify password if user has one (email/password auth)
      if (user.password) {
        if (!password) {
          return res.status(400).json({ message: 'Password is required to delete your account' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Incorrect password' });
        }
      }

      // Delete user's profile image from Cloudinary if exists
      if (user.profileImage) {
        try {
          const urlParts = user.profileImage.split('/');
          const uploadIndex = urlParts.indexOf('upload');
          if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
            const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
            const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
            await deleteImageFromCloudinary(publicId);
          }
        } catch (error) {
          console.error('Error deleting profile image:', error);
        }
      }

      // Delete the user account (cascade deletes will handle related data)
      const deleted = await storage.deleteUser(req.user!.userId);

      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete account' });
      }

      res.json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ message: 'Failed to delete account', error });
    }
  });

  // ====================
  // FAVORITES ROUTES
  // ====================
  app.post('/api/users/favorites', authenticateToken, async (req, res) => {
    try {
      const { salonId } = req.body;
      if (!salonId) {
        return res.status(400).json({ message: 'salonId is required' });
      }
      const updatedUser = await storage.addFavoriteSalon(req.user!.userId, salonId);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.delete('/api/users/favorites/:salonId', authenticateToken, async (req, res) => {
    try {
      const { salonId } = req.params;
      const updatedUser = await storage.removeFavoriteSalon(req.user!.userId, salonId);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ====================
  // SALON ROUTES
  // ====================
  app.get('/api/salons', async (req, res) => {
    try {
      const { location } = req.query;
      const salons = location
        ? await storage.getSalonsByLocation(location as string)
        : await storage.getAllSalons();

      const salonsWithDetails = await Promise.all(
        salons.map(async (salon) => {
          console.log('Processing salon with ID:', salon.id);
          const services = await storage.getServicesBySalon(salon.id);
          const queues = await storage.getQueuesBySalon(salon.id);
          const waitingQueues = queues.filter(q => q.status === 'waiting');
          const offers = await storage.getOffersBySalon(salon.id);
          const photos = await storage.getSalonPhotosBySalon(salon.id);
          const allReviews = await storage.getReviewsBySalon(salon.id);
          
          // Get only the latest review per user
          const latestReviewsMap = new Map();
          allReviews.forEach(review => {
            const existing = latestReviewsMap.get(review.userId);
            if (!existing || new Date(review.createdAt) > new Date(existing.createdAt)) {
              latestReviewsMap.set(review.userId, review);
            }
          });
          const reviews = Array.from(latestReviewsMap.values());
          
          console.log(`Found ${photos.length} photos for salon ${salon.id}`);

          return {
            ...salon,
            services,
            queueCount: waitingQueues.length,
            estimatedWaitTime: waitingQueues.length * 15,
            offers: offers.filter(o => o.isActive),
            photos,
            reviews,
            reviewCount: reviews.length,
          };
        })
      );

      // Sort salons: those with active offers first
      salonsWithDetails.sort((a, b) => {
        const aHasOffers = a.offers.length > 0;
        const bHasOffers = b.offers.length > 0;
        return (bHasOffers ? 1 : 0) - (aHasOffers ? 1 : 0);
      });

      res.json(salonsWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:id', async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.id);
      if (!salon) return res.status(404).json({ message: 'Salon not found' });

      const services = await storage.getServicesBySalon(salon.id);
      const offers = await storage.getOffersBySalon(salon.id);
      const allReviews = await storage.getReviewsBySalon(salon.id);
      
      // Get only the latest review per user
      const latestReviewsMap = new Map();
      allReviews.forEach(review => {
        const existing = latestReviewsMap.get(review.userId);
        if (!existing || new Date(review.createdAt) > new Date(existing.createdAt)) {
          latestReviewsMap.set(review.userId, review);
        }
      });
      const reviews = Array.from(latestReviewsMap.values());
      
      const queues = await storage.getQueuesBySalon(salon.id);
      const photos = await storage.getSalonPhotosBySalon(salon.id);
      const waitingQueues = queues.filter(q => q.status === 'waiting');

      res.json({
        ...salon,
        services,
        offers: offers.filter(o => o.isActive),
        reviews,
        photos,
        queueCount: waitingQueues.length,
        estimatedWaitTime: waitingQueues.length * 15,
        reviewCount: reviews.length,
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/salons', authenticateToken, async (req, res) => {
    try {
      console.log('Salon creation request received');
      console.log('User role:', req.user!.role);
      console.log('Request body:', req.body);

      if (req.user!.role !== 'salon_owner') {
        console.log('Authorization failed - not salon owner');
        return res.status(403).json({ message: 'Only salon owners can create salons' });
      }

      const salonData = insertSalonSchema.parse({ ...req.body, ownerId: req.user!.userId });
      console.log('Parsed salon data:', salonData);

      const salon = await storage.createSalon(salonData);
      console.log('Salon created successfully:', salon);

      res.status(201).json(salon);
    } catch (error) {
      console.error('Salon creation error:', error);
      res.status(400).json({ message: 'Invalid salon data', error: error.message });
    }
  });


  app.delete('/api/salons/:id', authenticateToken, async (req, res) => {
    try {
      console.log('Salon deletion request for ID:', req.params.id);
      const salon = await storage.getSalon(req.params.id);
      if (!salon) {
        console.log('Salon not found');
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        console.log('Authorization failed - not salon owner');
        return res.status(403).json({ message: 'Not authorized to delete this salon' });
      }

      // Delete associated photos first
      const photos = await storage.getSalonPhotosBySalon(req.params.id);
      for (const photo of photos) {
        try {
          await deleteImageFromCloudinary(photo.publicId);
          await storage.deleteSalonPhoto(photo.id);
        } catch (error) {
          console.error('Error deleting photo:', error);
        }
      }

      // Delete the salon
      const deleted = await storage.deleteSalon(req.params.id);
      if (!deleted) {
        return res.status(500).json({ message: 'Failed to delete salon' });
      }

      console.log('Salon deleted successfully');
      res.json({ message: 'Salon deleted successfully' });
    } catch (error) {
      console.error('Salon deletion error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  app.put('/api/salons/:id', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.id);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update this salon' });
      }

      const updates = insertSalonSchema.partial().parse(req.body);
      const updatedSalon = await storage.updateSalon(req.params.id, updates);
      res.json(updatedSalon);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data', error });
    }
  });

  // Service templates endpoint
  app.get('/api/service-templates/:salonType', (req, res) => {
    const { salonType } = req.params;

    const templates = {
      men: [
        { name: 'Haircut', duration: 30, price: '300', description: 'Basic haircut' },
        { name: 'Beard Trim', duration: 15, price: '150', description: 'Beard shaping and trim' },
        { name: 'Shave', duration: 20, price: '200', description: 'Clean shave' },
        { name: 'Hair Color', duration: 60, price: '800', description: 'Hair coloring service' },
        { name: 'Facial', duration: 45, price: '500', description: 'Facial treatment' },
      ],
      women: [
        { name: 'Haircut', duration: 45, price: '600', description: 'Hair cutting and styling' },
        { name: 'Hair Color', duration: 120, price: '1500', description: 'Full hair coloring' },
        { name: 'Highlights', duration: 90, price: '1200', description: 'Hair highlights' },
        { name: 'Blowdry', duration: 30, price: '400', description: 'Hair blow dry and styling' },
        { name: 'Manicure', duration: 30, price: '300', description: 'Nail care and polish' },
        { name: 'Pedicure', duration: 45, price: '500', description: 'Foot care and polish' },
        { name: 'Facial', duration: 60, price: '800', description: 'Facial treatment' },
        { name: 'Waxing', duration: 30, price: '400', description: 'Hair removal service' },
      ],
      unisex: [
        { name: 'Haircut', duration: 30, price: '400', description: 'Basic haircut' },
        { name: 'Hair Color', duration: 90, price: '1000', description: 'Hair coloring service' },
        { name: 'Beard Trim', duration: 15, price: '150', description: 'Beard shaping and trim' },
        { name: 'Facial', duration: 45, price: '600', description: 'Facial treatment' },
        { name: 'Manicure', duration: 30, price: '300', description: 'Nail care and polish' },
        { name: 'Pedicure', duration: 45, price: '500', description: 'Foot care and polish' },
      ],
    };

    const salonTemplates = templates[salonType as keyof typeof templates] || templates.unisex;
    res.json(salonTemplates);
  });

  // Service routes
  app.get('/api/salons/:salonId/services', async (req, res) => {
    try {
      const services = await storage.getServicesBySalon(req.params.salonId);
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/generate-description', async (req, res) => {
  try {
    const { serviceName } = req.body;
    
    if (!serviceName) {
      return res.status(400).json({ error: 'Service name is required' });
    }
    
    const description = await generateServiceDescription(serviceName);
    return res.json({ description });
  } catch (error: any) {
    console.error('Error generating description:', error);
    return res.status(500).json({ error: 'Failed to generate description' });
  }
});

app.post('/api/services', authenticateToken, async (req, res) => {
    try {
      console.log('Service creation request received:', req.body);
      console.log('User:', req.user);

      const serviceData = insertServiceSchema.parse(req.body);
      console.log('Parsed service data:', serviceData);

      // Verify salon ownership
      const salon = await storage.getSalon(serviceData.salonId);
      console.log('Salon found:', salon);
      console.log('Salon ownerId:', salon?.ownerId);
      console.log('Current userId:', req.user!.userId);

      if (!salon || salon.ownerId !== req.user!.userId) {
        console.log('Authorization failed - salon not found or wrong owner');
        return res.status(403).json({ message: 'Not authorized to add services to this salon' });
      }

      console.log('Creating service with data:', serviceData);
      const service = await storage.createService(serviceData);
      console.log('Service created successfully:', service);
      res.status(201).json(service);
    } catch (error) {
      console.error('Service creation error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation errors:', error.errors);
        return res.status(400).json({ message: 'Invalid service data', errors: error.errors });
      }
      res.status(400).json({ message: 'Invalid service data', error: error instanceof Error ? error.message : error });
    }
  });

  app.put('/api/services/:id', authenticateToken, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(service.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update services for this salon' });
      }

      const updates = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(req.params.id, updates);
      res.json(updatedService);
    } catch (error) {
      res.status(400).json({ message: 'Invalid service data', error });
    }
  });

  app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(service.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to delete services for this salon' });
      }

      await storage.deleteService(req.params.id);
      res.json({ message: 'Service deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Queue routes
  app.get('/api/queues/my', authenticateToken, async (req, res) => {
    try {
      const queues = await storage.getQueuesByUser(req.user!.userId);

      const queuesWithDetails = await Promise.all(
        queues.map(async (queue) => {
          const salon = await storage.getSalon(queue.salonId);

          // Fetch all services for the queue
          let services = [];
          if (queue.serviceIds && queue.serviceIds.length > 0) {
            const servicePromises = queue.serviceIds.map(async (serviceId) => {
              const service = await storage.getService(serviceId);
              return service; // Only add if service exists
            });
            services = (await Promise.all(servicePromises)).filter(Boolean);
          }

          // For backward compatibility
          const service = queue.serviceId ? await storage.getService(queue.serviceId) : null;

          // Get all active queues for this salon (not completed or no-show)
          const salonQueues = await storage.getQueuesBySalon(queue.salonId);
          const activeQueues = salonQueues.filter(q => 
            q.status === 'waiting' || 
            q.status === 'notified' || 
            q.status === 'pending_verification' || 
            q.status === 'nearby' || 
            q.status === 'in-progress'
          );

          // Calculate real-time position based on timestamp
          let userPosition = queue.position;
          
          if (queue.status === 'in-progress') {
            userPosition = 0; // Currently being served
          } else if (queue.status === 'completed' || queue.status === 'no-show') {
            userPosition = 0; // No position for completed/no-show
          } else {
            // Sort active queues by timestamp to get real position
            const sortedQueues = activeQueues.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            const userIndex = sortedQueues.findIndex(q => q.id === queue.id);
            userPosition = userIndex !== -1 ? userIndex + 1 : queue.position;
          }

          // Ensure we have a valid services array
          const queueWithDetails = {
            ...queue,
            position: userPosition,
            salon,
            service, // Keep for backward compatibility
            services: services.length > 0 ? services : undefined, // Add all services if available
            totalInQueue: activeQueues.length,
          };

          return queueWithDetails;
        })
      );

      res.json(queuesWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:salonId/queues', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view salon queues' });
      }

      const queues = await storage.getQueuesBySalon(req.params.salonId);

      // Get user and service details
      const queuesWithDetails = await Promise.all(
        queues.map(async (queue) => {
          const user = await storage.getUser(queue.userId);

          // Fetch all services for the queue
          let services = [];
          if (queue.serviceIds && queue.serviceIds.length > 0) {
            const servicePromises = queue.serviceIds.map(async (serviceId) => {
              const service = await storage.getService(serviceId);
              return service; // Only add if service exists
            });
            services = (await Promise.all(servicePromises)).filter(Boolean);
          }

          // For backward compatibility
          const service = queue.serviceId ? await storage.getService(queue.serviceId) : null;

          // Ensure we have a valid services array
          const queueWithDetails = {
            ...queue,
            user: user ? { ...user, password: undefined } : null,
            service, // Keep for backward compatibility
            services: services.length > 0 ? services : undefined, // Add all services if available
          };

          // For debugging
          console.log(`Salon queue ${queue.id} services:`, services);

          return queueWithDetails;
        })
      );

      res.json(queuesWithDetails);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.get('/api/salons/:salonId/offers', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Verify salon ownership
      if (salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view offers for this salon' });
      }

      const offers = await storage.getOffersBySalon(req.params.salonId);
      console.log(`Fetching offers for salon ${req.params.salonId}:`, offers);
      console.log(`Number of offers found: ${offers.length}`);
      console.log(`Offers data:`, JSON.stringify(offers, null, 2));
      res.json(offers);
    } catch (error) {
      console.error('Error fetching offers:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });

  app.post('/api/queues', authenticateToken, async (req, res) => {
    try {
      console.log('Queue creation request body:', req.body);
      console.log('User ID from token:', req.user!.userId);

      const queueData = insertQueueSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      console.log('Parsed queue data:', queueData);

      // Check if user is already in active queue for this salon
      const existingQueue = await storage.getUserQueuePosition(req.user!.userId, queueData.salonId);
      if (existingQueue && (existingQueue.status === 'waiting' || existingQueue.status === 'in-progress')) {
        return res.status(400).json({ message: 'Already in queue for this salon' });
      }

      const queue = await storage.createQueue(queueData);

      // Check if loyalty discount was applied and deduct points
      const user = await storage.getUser(req.user!.userId);
      if (user && user.salonLoyaltyPoints) {
        const salonPoints = user.salonLoyaltyPoints[queueData.salonId] || 0;

        // Determine if discount was applied based on points
        let pointsToDeduct = 0;
        if (salonPoints >= 100) {
          // 20% discount was applied, deduct 100 points
          pointsToDeduct = 100;
        } else if (salonPoints >= 50) {
          // 10% discount was applied, deduct 50 points
          pointsToDeduct = 50;
        }

        if (pointsToDeduct > 0) {
          const updatedSalonPoints = { ...user.salonLoyaltyPoints };
          updatedSalonPoints[queueData.salonId] = salonPoints - pointsToDeduct;

          await storage.updateUser(req.user!.userId, {
            loyaltyPoints: (user.loyaltyPoints || 0) - pointsToDeduct,
            salonLoyaltyPoints: updatedSalonPoints
          });

          console.log(`Deducted ${pointsToDeduct} loyalty points from user ${req.user!.userId} for salon ${queueData.salonId}`);
        }
      }

      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queueData.salonId);
      broadcastQueueUpdate(queueData.salonId, { queues: salonQueues });

      res.status(201).json(queue);
    } catch (error) {
      console.error('Queue creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: 'Invalid queue data', error: error.message });
      } else {
        res.status(400).json({ message: 'Invalid queue data', error: 'Unknown error occurred' });
      }
    }
  });

  app.put('/api/queues/:id', authenticateToken, async (req, res) => {
    try {
      const queue = await storage.getQueue(req.params.id);
      if (!queue) {
        return res.status(404).json({ message: 'Queue entry not found' });
      }

      // Check authorization
      const salon = await storage.getSalon(queue.salonId);
      if (queue.userId !== req.user!.userId && salon?.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update this queue entry' });
      }

      const updates = insertQueueSchema.partial().parse(req.body);
      const updatedQueue = await storage.updateQueue(req.params.id, updates);

      // Award loyalty points when queue is completed
      if (updates.status === 'completed' && queue.status !== 'completed') {
        const user = await storage.getUser(queue.userId);
        if (user) {
          const salonLoyaltyPoints = user.salonLoyaltyPoints || {};
          const currentPoints = salonLoyaltyPoints[queue.salonId] || 0;
          const newPoints = currentPoints + 25;

          // Update salon-specific loyalty points
          salonLoyaltyPoints[queue.salonId] = newPoints;

          // Update total loyalty points
          const totalLoyaltyPoints = (user.loyaltyPoints || 0) + 25;

          await storage.updateUser(queue.userId, {
            loyaltyPoints: totalLoyaltyPoints,
            salonLoyaltyPoints: salonLoyaltyPoints
          });
        }
      }

      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queue.salonId);
      broadcastQueueUpdate(queue.salonId, { queues: salonQueues });

      res.json(updatedQueue);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data', error });
    }
  });

  app.delete('/api/queues/:id', authenticateToken, async (req, res) => {
    try {
      const queue = await storage.getQueue(req.params.id);
      if (!queue) {
        return res.status(404).json({ message: 'Queue entry not found' });
      }

      if (queue.userId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to leave this queue' });
      }

      await storage.deleteQueue(req.params.id);

      // Broadcast queue update
      const salonQueues = await storage.getQueuesBySalon(queue.salonId);
      broadcastQueueUpdate(queue.salonId, { queues: salonQueues });

      res.json({ message: 'Left queue successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Offer routes
  app.get('/api/offers', async (req, res) => {
    try {
      const offers = await storage.getActiveOffers();
      res.json(offers);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Public endpoint to get offers for a salon - no authentication required
  app.get('/api/salons/:salonId/public-offers', async (req, res) => {
    try {
      const salonId = req.params.salonId;
      console.log('Fetching offers for salon:', salonId);

      const salon = await storage.getSalon(salonId);

      if (!salon) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      const offers = await storage.getOffersBySalon(salonId);
      console.log('Found offers for salon:', offers);

      // Only return active offers with valid dates
      const now = new Date();
      const activeOffers = offers.filter(offer => offer.isActive && new Date(offer.validityPeriod) > now);
      console.log('Active offers after filtering:', activeOffers);

      res.json(activeOffers);
    } catch (error) {
      console.error('Error fetching salon offers:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  app.post('/api/offers', authenticateToken, async (req, res) => {
    try {
      console.log('Raw request body:', req.body);
      console.log('validityPeriod type:', typeof req.body.validityPeriod);
      console.log('validityPeriod value:', req.body.validityPeriod);

      const offerData = insertOfferSchema.parse(req.body);
      console.log('Parsed offer data:', offerData);

      // Verify salon ownership
      const salon = await storage.getSalon(offerData.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to create offers for this salon' });
      }

      const offer = await storage.createOffer(offerData);
      res.status(201).json(offer);
    } catch (error) {
      console.error('Offer creation error:', error);
      res.status(400).json({ message: 'Invalid offer data', error });
    }
  });

  app.put('/api/offers/:id', authenticateToken, async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(offer.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to update offers for this salon' });
      }

      const updates = insertOfferSchema.partial().parse(req.body);
      const updatedOffer = await storage.updateOffer(req.params.id, updates);
      res.json(updatedOffer);
    } catch (error) {
      res.status(400).json({ message: 'Invalid offer data', error });
    }
  });

  app.delete('/api/offers/:id', authenticateToken, async (req, res) => {
    try {
      const offer = await storage.getOffer(req.params.id);
      if (!offer) {
        return res.status(404).json({ message: 'Offer not found' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(offer.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to delete offers for this salon' });
      }

      await storage.deleteOffer(req.params.id);
      res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Review routes
  app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user!.userId,
      });

      const review = await storage.createReview(reviewData);

      // Update salon rating
      const allReviews = await storage.getReviewsBySalon(reviewData.salonId);
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await storage.updateSalon(reviewData.salonId, { rating: avgRating.toFixed(1) });

      res.status(201).json(review);
    } catch (error) {
      res.status(400).json({ message: 'Invalid review data', error });
    }
  });

  // Analytics routes
  app.get('/api/analytics/:salonId', authenticateToken, async (req, res) => {
    try {
      const salon = await storage.getSalon(req.params.salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to view analytics for this salon' });
      }

      const queues = await storage.getQueuesBySalon(req.params.salonId);
      const services = await storage.getServicesBySalon(req.params.salonId);
      const reviews = await storage.getReviewsBySalon(req.params.salonId);

      // Calculate analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's completed customers (not all queues from today)
      const todayCompletedQueues = queues.filter(q => 
        q.status === 'completed' && 
        new Date(q.timestamp).setHours(0, 0, 0, 0) >= today.getTime()
      );
      
      const completedQueues = queues.filter(q => q.status === 'completed');
      
      // Calculate revenue from completed queues using totalPrice
      const totalRevenue = completedQueues.reduce((sum, queue) => {
        const price = typeof queue.totalPrice === 'number' ? queue.totalPrice : parseFloat(queue.totalPrice || '0');
        return sum + (isNaN(price) ? 0 : price);
      }, 0);

      // Calculate popular services by counting serviceIds in completed queues
      const serviceBookingCounts: Record<string, number> = {};
      completedQueues.forEach(queue => {
        if (queue.serviceIds && Array.isArray(queue.serviceIds)) {
          queue.serviceIds.forEach(serviceId => {
            serviceBookingCounts[serviceId] = (serviceBookingCounts[serviceId] || 0) + 1;
          });
        }
      });

      const analytics = {
        customersToday: todayCompletedQueues.length, // Only completed customers from today
        totalCustomers: completedQueues.length, // Total completed customers (not all queues)
        avgWaitTime: queues.length > 0 ? queues.reduce((sum, q) => sum + (q.estimatedWaitTime || 15), 0) / queues.length : 0,
        rating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        showRate: queues.length > 0 ? (completedQueues.length / queues.length) * 100 : 100,
        revenue: totalRevenue,
        popularServices: services.map(service => ({
          ...service,
          bookings: serviceBookingCounts[service.id] || 0,
        })).sort((a, b) => b.bookings - a.bookings),
      };

      // Debug logging
      console.log('Analytics calculation for salon:', req.params.salonId);
      console.log('Total queues:', queues.length);
      console.log('Completed queues:', completedQueues.length);
      console.log('Today completed queues:', todayCompletedQueues.length);
      console.log('Total revenue:', totalRevenue);
      console.log('Analytics result:', analytics);

      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // ====================
  // SALON PHOTO ROUTES
  // ====================

  // Test endpoint to verify routing
  app.get('/api/test-photos', (req, res) => {
    console.log('=== TEST PHOTOS ENDPOINT HIT ===');
    res.json({ message: 'Photo routes are working', timestamp: new Date().toISOString() });
  });

  // Test endpoint to verify photo saving with your salon ID
  app.post('/api/test-photo-save', async (req, res) => {
    try {
      console.log('=== TEST PHOTO SAVE ENDPOINT HIT ===');

      const testPhotoData = {
        salonId: 'a5562294-9026-46c6-9086-ef1518ad5b39', // Your salon ID
        url: 'https://test-cloudinary-url.com/test-image.jpg',
        publicId: 'test-public-id',
      };

      console.log('Test photo data:', testPhotoData);

      // Test schema validation first
      try {
        const validatedData = insertSalonPhotoSchema.parse(testPhotoData);
        console.log('Schema validation successful:', validatedData);
      } catch (schemaError) {
        console.error('Schema validation failed:', schemaError);
        return res.status(400).json({ error: 'Schema validation failed', details: schemaError.message });
      }

      const photo = await storage.createSalonPhoto(testPhotoData);
      console.log('Test photo saved successfully:', photo);

      // Verify it was saved by fetching it back
      const savedPhotos = await storage.getSalonPhotosBySalon('a5562294-9026-46c6-9086-ef1518ad5b39');
      console.log('Photos found for salon after test save:', savedPhotos.length);

      res.status(201).json({ success: true, photo, totalPhotos: savedPhotos.length });
    } catch (error) {
      console.error('Test photo save error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get salon photos
  app.get('/api/salons/:salonId/photos', async (req, res) => {
    try {
      console.log('=== GET PHOTOS ENDPOINT HIT ===', req.params.salonId);
      const photos = await storage.getSalonPhotosBySalon(req.params.salonId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

  // Upload salon photo
  app.post('/api/salons/:salonId/photos', authenticateToken, upload.single('image'), async (req, res) => {
    try {
      console.log('=== PHOTO UPLOAD ENDPOINT HIT ===');
      console.log('Photo upload request received for salon:', req.params.salonId);
      console.log('File received:', !!req.file);
      console.log('User ID:', req.user?.userId);

      if (!req.file) {
        console.log('No file provided in request');
        return res.status(400).json({ message: 'No image file provided' });
      }

      // Verify salon ownership
      const salon = await storage.getSalon(req.params.salonId);
      console.log('Salon found:', !!salon);
      console.log('Salon owner ID:', salon?.ownerId);

      if (!salon || salon.ownerId !== req.user!.userId) {
        console.log('Authorization failed - salon owner mismatch');
        return res.status(403).json({ message: 'Not authorized to upload photos for this salon' });
      }

      console.log('Uploading to Cloudinary...');
      // Upload to Cloudinary
      const { url, publicId } = await uploadImageToCloudinary(req.file.buffer, 'salon_photos');
      console.log('Cloudinary upload successful:', { url, publicId });

      // Save to database
      console.log('Preparing photo data for database save...');

      // Create photo data without schema validation first to test
      const photoData = {
        salonId: req.params.salonId,
        url,
        publicId,
      };
      console.log('Photo data to save:', photoData);

      // Validate with schema
      try {
        const validatedData = insertSalonPhotoSchema.parse(photoData);
        console.log('Schema validation successful:', validatedData);
      } catch (schemaError) {
        console.error('Schema validation failed:', schemaError);
        throw new Error(`Schema validation failed: ${schemaError.message}`);
      }

      console.log('Calling storage.createSalonPhoto...');
      const photo = await storage.createSalonPhoto(photoData);
      console.log('Photo saved to database successfully:', photo);

      // Verify the photo was saved by fetching it back
      console.log('Verifying photo was saved...');
      const savedPhotos = await storage.getSalonPhotosBySalon(req.params.salonId);
      console.log('Photos found for salon after save:', savedPhotos.length);

      res.status(201).json(photo);
    } catch (error) {
      console.error('Photo upload error:', error);
      res.status(400).json({ message: 'Failed to upload photo', error: error.message });
    }
  });

  // Delete salon photo
  app.delete('/api/salons/:salonId/photos/:photoId', authenticateToken, async (req, res) => {
    try {
      const { salonId, photoId } = req.params;

      // Verify salon ownership
      const salon = await storage.getSalon(salonId);
      if (!salon || salon.ownerId !== req.user!.userId) {
        return res.status(403).json({ message: 'Not authorized to delete photos for this salon' });
      }

      // Check if this is the last photo (must keep at least one)
      const photoCount = await storage.getSalonPhotoCount(salonId);
      if (photoCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last photo. At least one photo is required.' });
      }

      // Get photo details for Cloudinary deletion
      const photo = await storage.getSalonPhoto(photoId);
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      // Delete from Cloudinary
      await deleteImageFromCloudinary(photo.publicId);

      // Delete from database
      const deleted = await storage.deleteSalonPhoto(photoId);
      if (!deleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }

      res.json({ message: 'Photo deleted successfully' });
    } catch (error) {
      console.error('Photo deletion error:', error);
      res.status(500).json({ message: 'Failed to delete photo', error });
    }
  });

  // OTP Verification Routes

  // Send email OTP
  app.post('/api/auth/send-email-otp', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const success = await otpService.sendEmailOTP(userId, user.email, user.name);

      if (success) {
        res.json({ message: 'Email OTP sent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to send email OTP' });
      }
    } catch (error) {
      console.error('Send email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Send phone OTP
  app.post('/api/auth/send-phone-otp', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.phone) {
        return res.status(404).json({ message: 'User not found or no phone number' });
      }

      const otp = await otpService.sendPhoneOTP(userId, user.phone, user.name);

      if (otp) {
        res.json({ message: 'SMS OTP sent successfully', otp });
      } else {
        res.status(500).json({ message: 'Failed to send SMS OTP' });
      }
    } catch (error) {
      console.error('Send phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify email OTP
  app.post('/api/auth/verify-email-otp', async (req, res) => {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        return res.status(400).json({ message: 'User ID and OTP are required' });
      }

      const success = await otpService.verifyEmailOTP(userId, otp);

      if (success) {
        res.json({ message: 'Email verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      console.error('Verify email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Verify phone OTP
  app.post('/api/auth/verify-phone-otp', async (req, res) => {
    try {
      const { userId, otp } = req.body;

      if (!userId || !otp) {
        return res.status(400).json({ message: 'User ID and OTP are required' });
      }

      const success = await otpService.verifyPhoneOTP(userId, otp);

      if (success) {
        res.json({ message: 'Phone verified successfully' });
      } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
      }
    } catch (error) {
      console.error('Verify phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Resend email OTP
  app.post('/api/auth/resend-email-otp', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const success = await otpService.resendEmailOTP(userId);

      if (success) {
        res.json({ message: 'Email OTP resent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to resend email OTP' });
      }
    } catch (error) {
      console.error('Resend email OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Resend phone OTP
  app.post('/api/auth/resend-phone-otp', async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const success = await otpService.resendPhoneOTP(userId);

      if (success) {
        res.json({ message: 'SMS OTP resent successfully' });
      } else {
        res.status(500).json({ message: 'Failed to resend SMS OTP' });
      }
    } catch (error) {
      console.error('Resend phone OTP error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp webhook verification
  app.get('/api/webhook/whatsapp', async (req, res) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const whatsappService = await import('./whatsappService');
      const result = await whatsappService.default.verifyWebhook(mode as string, token as string, challenge as string);

      if (result) {
        res.status(200).send(result);
      } else {
        res.status(403).json({ message: 'Webhook verification failed' });
      }
    } catch (error) {
      console.error('WhatsApp webhook verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp webhook handler
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      const whatsappService = await import('./whatsappService');
      await whatsappService.default.handleWebhook(req.body);
      res.status(200).json({ message: 'Webhook processed' });
    } catch (error) {
      console.error('WhatsApp webhook handler error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ====================
  // QUEUE MANAGEMENT ROUTES
  // ====================
  const { registerQueueManagementRoutes } = await import('./routes/queueManagement');
  registerQueueManagementRoutes(app, authenticateToken);

  // ====================
  // PUSH NOTIFICATION ROUTES
  // ====================
  app.use('/api/push', pushRoutes);

  // ====================
  // AUDIT ROUTES
  // ====================
  app.use('/api', auditRoutes);

  // ====================
  // ANALYTICS ROUTES
  // ====================
  app.use('/api/analytics', analyticsRoutes);

  // ====================
  // HEALTH CHECK ROUTES
  // ====================
  app.use('/api/health', healthRoutes);

  return httpServer;
}
