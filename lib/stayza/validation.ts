import { z } from 'zod'

const cleanText = (max: number) => z.string().trim().min(1).max(max)

export const searchSchema = z.object({
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  guests: z.coerce.number().int().min(1).max(20),
})

export const quoteSchema = searchSchema.extend({
  propertyId: cleanText(100),
})

export const bookingRequestSchema = z.object({
  propertyId: cleanText(100),
  guestName: cleanText(120),
  guestEmail: z.string().trim().email().max(200),
  guestPhone: z
    .string()
    .trim()
    .min(8)
    .max(30)
    .regex(/^[+()\d\s-]+$/, 'Please enter a valid phone number.'),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  specialRequests: z.string().trim().max(1000).optional().default(''),
  source: z.enum(['little_hut_direct', 'stayza_mcp']).optional(),
  attribution: z
    .object({
      utmSource: z.string().trim().max(120).optional(),
      utmMedium: z.string().trim().max(120).optional(),
      utmCampaign: z.string().trim().max(120).optional(),
      referrer: z.string().trim().max(500).optional(),
    })
    .optional(),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
})

export const bookingStatusSchema = z.object({
  reference: cleanText(40).transform((value) => value.toUpperCase()),
  email: z.string().trim().email().max(200),
})

export const ownerApplicationSchema = z.object({
  ownerName: cleanText(120),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(30)
    .regex(/^[+()\d\s-]+$/, 'Please enter a valid phone number.'),
  propertyName: cleanText(160),
  location: cleanText(200),
  propertyType: z.enum(['villa', 'chalet', 'apartment', 'other']),
  bedrooms: z.coerce.number().int().min(0).max(30),
  maxGuests: z.coerce.number().int().min(1).max(50),
  operationNotes: z.string().trim().min(20).max(2000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default(''),
})
