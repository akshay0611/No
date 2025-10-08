// Frontend API Types - Basic types for API communication

export interface Login {
  email: string;
  password: string;
}

export interface InsertUser {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "customer" | "salon_owner";
}

export interface InsertSalon {
  ownerId: string;
  name: string;
  description?: string;
  location: string;
  manualLocation?: string;
  type: "men" | "women" | "unisex";
  operatingHours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  images?: string[];
}

export interface InsertService {
  salonId: string;
  name: string;
  duration: number; // in minutes
  price: string;
  description?: string;
}

export interface InsertQueue {
  salonId: string;
  userId: string;
  serviceIds: string[];
  totalPrice: number;
  appliedOffers?: string[];
  estimatedWaitTime?: number;
}

export interface InsertOffer {
  salonId: string;
  title: string;
  description: string;
  discount: number;
  validityPeriod: Date;
  isActive?: boolean;
}

export interface InsertReview {
  salonId: string;
  userId: string;
  rating: number;
  comment?: string;
}
