import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  expirationTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
});

// Index for cleanup of expired subscriptions
pushSubscriptionSchema.index({ expirationTime: 1 }, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { expirationTime: { $exists: true, $ne: null } }
});

export const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
