import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().min(2).max(80)
});

export const listingSchema = z.object({
  productName: z.string().min(2).max(120),
  cost: z.coerce.number().nonnegative(),
  salePrice: z.coerce.number().positive(),
  marketplace: z.string().min(2).max(40),
  shippingCost: z.coerce.number().nonnegative(),
  commissionPercent: z.coerce.number().min(0).max(80),
  adsPercent: z.coerce.number().min(0).max(80).default(0),
  taxPercent: z.coerce.number().min(0).max(80).default(0),
  packagingCost: z.coerce.number().min(0).default(0),
  differentiator: z.string().min(3).max(500),
  targetAudience: z.string().max(500).optional(),
  competitorNotes: z.string().max(1000).optional(),
  logisticsNotes: z.string().max(1000).optional()
});
