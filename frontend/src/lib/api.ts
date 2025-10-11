import { apiRequest } from "./queryClient";
import type { InsertUser, InsertSalon, InsertService, InsertQueue, InsertOffer, InsertReview, Login } from "../types/api";
import type { AuthResponse, Analytics } from "../types";

export const api = {
  auth: {
    login: async (credentials: Login): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    
    register: async (userData: InsertUser): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    
    getProfile: async () => {
      const response = await apiRequest('GET', '/api/auth/profile');
      return response.json();
    },

    // Phone authentication endpoints
    sendOTP: async (phoneNumber: string) => {
      const response = await apiRequest('POST', '/api/auth/send-otp', { phoneNumber });
      return response.json();
    },

    verifyOTP: async (phoneNumber: string, otp: string): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/verify-otp', { phoneNumber, otp });
      return response.json();
    },

    completeProfile: async (name: string, email?: string) => {
      const response = await apiRequest('PUT', '/api/user/complete', { name, email });
      return response.json();
    },

    updateProfile: async (profileData: { name?: string; phone?: string; email?: string }) => {
      const response = await apiRequest('PUT', '/api/user/profile', profileData);
      return response.json();
    },

    // Google authentication
    googleAuth: async (credential: string, role?: 'customer' | 'salon_owner'): Promise<AuthResponse> => {
      const response = await apiRequest('POST', '/api/auth/google', { credential, role });
      return response.json();
    },
  },

  salons: {
    getAll: async (location?: string) => {
      const url = location ? `/api/salons?location=${encodeURIComponent(location)}` : '/api/salons';
      const response = await apiRequest('GET', url);
      return response.json();
    },
    
    getById: async (id: string) => {
      const response = await apiRequest('GET', `/api/salons/${id}`);
      return response.json();
    },
    
    create: async (salonData: InsertSalon) => {
      const response = await apiRequest('POST', '/api/salons', salonData);
      return response.json();
    },
    
    update: async (id: string, updates: Partial<InsertSalon>) => {
      const response = await apiRequest('PUT', `/api/salons/${id}`, updates);
      return response.json();
    },
    
    getQueues: async (salonId: string) => {
      const response = await apiRequest('GET', `/api/salons/${salonId}/queues`);
      return response.json();
    },
    
    getAnalytics: async (salonId: string): Promise<Analytics> => {
      const response = await apiRequest('GET', `/api/analytics/${salonId}`);
      return response.json();
    },
  },

  services: {
    getBySalon: async (salonId: string) => {
      const response = await apiRequest('GET', `/api/salons/${salonId}/services`);
      return response.json();
    },
    
    create: async (serviceData: InsertService) => {
      const response = await apiRequest('POST', '/api/services', serviceData);
      return response.json();
    },

    update: async (id: string, updates: Partial<InsertService>) => {
      const response = await apiRequest('PUT', `/api/services/${id}`, updates);
      return response.json();
    },

    delete: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/services/${id}`);
      return response.json();
    },
  },

  queue: {
    getMy: async () => {
      const response = await apiRequest('GET', '/api/queues/my');
      return response.json();
    },
    
    join: async (queueData: InsertQueue) => {
      const response = await apiRequest('POST', '/api/queues', queueData);
      return response.json();
    },
    
    update: async (id: string, updates: Partial<InsertQueue>) => {
      const response = await apiRequest('PUT', `/api/queues/${id}`, updates);
      return response.json();
    },
    
    leave: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/queues/${id}`);
      return response.json();
    },
  },

  offers: {
    getActive: async () => {
      const response = await apiRequest('GET', '/api/offers');
      return response.json();
    },
    
    getBySalon: async (salonId: string) => {
      // Use fetch directly without authentication for this public endpoint
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/salons/${salonId}/public-offers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }
      return response.json();
    },
    
    create: async (offerData: InsertOffer) => {
      const response = await apiRequest('POST', '/api/offers', offerData);
      return response.json();
    },
    
    update: async (id: string, updates: Partial<InsertOffer>) => {
      const response = await apiRequest('PUT', `/api/offers/${id}`, updates);
      return response.json();
    },
    
    delete: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/offers/${id}`);
      return response.json();
    },
  },

  reviews: {
    create: async (reviewData: InsertReview) => {
      const response = await apiRequest('POST', '/api/reviews', reviewData);
      return response.json();
    },
  },

  users: {
    addFavorite: async (salonId: string) => {
      const response = await apiRequest('POST', '/api/users/favorites', { salonId });
      return response.json();
    },
    removeFavorite: async (salonId: string) => {
      const response = await apiRequest('DELETE', `/api/users/favorites/${salonId}`);
      return response.json();
    },
  },
};
