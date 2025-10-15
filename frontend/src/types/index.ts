// Basic types for frontend - these should match backend schema
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  location?: string;
  bio?: string;
  profileImage?: string;
  loyaltyPoints: number;
  salonLoyaltyPoints?: Record<string, number>;
  favoriteSalons: string[];
  createdAt: Date;
}

export interface Salon {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  location: string;
  manualLocation?: string;
  type: "men" | "women" | "unisex";
  operatingHours?: any;
  rating: string;
  images: string[];
  createdAt: Date;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface Service {
  id: string;
  salonId: string;
  name: string;
  duration: number;
  price: string;
  description?: string;
  createdAt: Date;
}

export interface Queue {
  id: string;
  salonId: string;
  userId: string;
  serviceIds: string[];
  totalPrice: number;
  appliedOffers: string[];
  status: "waiting" | "notified" | "pending_verification" | "nearby" | "in-progress" | "completed" | "no-show";
  position: number;
  timestamp: Date;
  estimatedWaitTime?: number;
  notifiedAt?: Date;
  notificationMinutes?: number;
  checkInAttemptedAt?: Date;
  checkInLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  checkInDistance?: number;
  verifiedAt?: Date;
  verificationMethod?: 'gps_auto' | 'manual' | 'admin_override';
  verifiedBy?: string;
  serviceStartedAt?: Date;
  serviceCompletedAt?: Date;
  noShowMarkedAt?: Date;
  noShowReason?: string;
}

export interface Offer {
  id: string;
  salonId: string;
  title: string;
  description: string;
  discount: number;
  validityPeriod: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  salonId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  userName?: string;
  userProfileImage?: string | null;
}

export interface SalonPhoto {
  id: string;
  salonId: string;
  url: string;
  publicId: string;
  createdAt: string;
}

export interface SalonWithDetails extends Salon {
  services: Service[];
  queueCount: number;
  estimatedWaitTime: number;
  offers: Offer[];
  photos: SalonPhoto[];
  reviews?: Review[];
  reviewCount?: number;
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface SalonDetails extends Salon {
  services: Service[];
  offers: Offer[];
  reviews: Review[];
  queueCount: number;
  estimatedWaitTime: number;
  photos?: SalonPhoto[];
  latitude?: number;
  longitude?: number;
  fullAddress?: string;
}

export interface QueueWithDetails extends Queue {
  salon: Salon | null;
  service: Service | null;
  services?: Service[];
  user?: User | null;
  totalInQueue?: number;
}

export interface AuthResponse {
  user: User;
  token: string;
  isNewUser?: boolean;
  message?: string;
}

export interface Analytics {
  customersToday: number;
  totalCustomers: number;
  avgWaitTime: number;
  rating: number;
  showRate: number;
  revenue: number;
  popularServices: (Service & { bookings: number })[];
}

export interface WebSocketMessage {
  type: 'queue_join' | 'queue_update' | 'notification' | 'queue_notification' | 'customer_arrived' | 'queue_position_update' | 'service_starting' | 'service_completed' | 'no_show';
  salonId?: string;
  userId?: string;
  queueId?: string;
  data?: any;
  // Queue notification specific fields
  salonName?: string;
  salonAddress?: string;
  estimatedMinutes?: number;
  services?: any[];
  salonLocation?: {
    latitude: number;
    longitude: number;
  };
  timestamp?: string;
}

export interface PendingVerification {
  queueId: string;
  userName: string;
  userPhone: string;
  distance?: number;
  checkInTime: Date;
  reason: 'no_location' | 'too_far' | 'suspicious';
}
