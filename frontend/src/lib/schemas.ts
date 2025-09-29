import { z } from "zod";

// Basic validation schemas for frontend forms
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "salon_owner"]).default("customer"),
});

export const insertSalonSchema = z.object({
  name: z.string().min(1, "Salon name is required"),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  type: z.enum(["men", "women", "unisex"]).default("unisex"),
  operatingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),
  images: z.array(z.string()).default([]),
});

export const insertServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.string().min(1, "Price is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertOfferSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  discount: z.number().min(1, "Discount must be at least 1"),
  validityPeriod: z.union([
    z.string().datetime().transform((str) => new Date(str)),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform((str) => new Date(str)),
    z.date()
  ]),
  isActive: z.boolean().default(true),
});

export const insertReviewSchema = z.object({
  rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type UserFormData = z.infer<typeof insertUserSchema>;
export type SalonFormData = z.infer<typeof insertSalonSchema>;
export type ServiceFormData = z.infer<typeof insertServiceSchema>;
export type OfferFormData = z.infer<typeof insertOfferSchema>;
export type ReviewFormData = z.infer<typeof insertReviewSchema>;
