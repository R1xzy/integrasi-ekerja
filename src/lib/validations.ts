import { z } from 'zod';

// Validation schemas untuk request body

export const registerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'), // [C-15]
  phoneNumber: z.string().optional(),
  roleId: z.number().int().min(1),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  profilePictureUrl: z.string().url().optional(),
  providerBio: z.string().optional(),
});

export const providerServiceSchema = z.object({
  categoryId: z.number().int().min(1),
  serviceTitle: z.string().min(1, 'Service title is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  priceUnit: z.string().default('per project'),
  isAvailable: z.boolean().default(true),
});

export const portfolioSchema = z.object({
  projectTitle: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  completedAt: z.string().datetime().optional(),
});

export const documentSchema = z.object({
  documentType: z.enum(['KTP', 'SERTIFIKAT_PELATIHAN']),
  documentName: z.string().min(1, 'Document name is required'),
  issuingOrganization: z.string().optional(),
  credentialId: z.string().optional(),
  fileUrl: z.string().url('Valid file URL is required'),
  issuedAt: z.string().datetime().optional(),
});

export const orderSchema = z.object({
  providerId: z.number().int().min(1),
  providerServiceId: z.number().int().min(1),
  scheduledDate: z.string().datetime(),
  jobAddress: z.string().min(1, 'Job address is required'),
  district: z.string().min(1, 'District is required'),
  subDistrict: z.string().min(1, 'Sub district is required'),
  ward: z.string().min(1, 'Ward is required'),
  jobDescriptionNotes: z.string().optional(),
});

export const verificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED', 'NEEDS_RESUBMISSION']),
  verifiedAt: z.string().datetime().optional(),
});

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Export types
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
export type ProviderServiceData = z.infer<typeof providerServiceSchema>;
export type PortfolioData = z.infer<typeof portfolioSchema>;
export type DocumentData = z.infer<typeof documentSchema>;
export type OrderData = z.infer<typeof orderSchema>;
export type VerificationData = z.infer<typeof verificationSchema>;
