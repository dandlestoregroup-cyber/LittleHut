export type BookingStatus =
  | 'requested'
  | 'confirmed'
  | 'declined'
  | 'cancelled'
  | 'expired'

export interface RatePeriod {
  id: string
  label: string
  start: string
  end: string
  nightlyRate: number
  minimumNights: number
}

export interface StayProperty {
  id: string
  slug: string
  name: string
  location: string
  summary: string
  description: string
  propertyType: 'villa' | 'chalet' | 'apartment'
  maxGuests: number
  bedrooms: number
  bathrooms: number
  baseNightlyRate: number
  minimumSuggestedRate: number
  minimumNights: number
  currency: 'EGP'
  heroImage: string
  gallery: string[]
  features: string[]
  ratePeriods: RatePeriod[]
  active: boolean
}

export interface QuoteNight {
  date: string
  rate: number
  rateLabel: string
}

export interface StayQuote {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  nightly: QuoteNight[]
  accommodationTotal: number
  feesTotal: number
  total: number
  currency: 'EGP'
  minimumNights: number
}

export interface BookingRecord {
  id: string
  reference: string
  propertyId: string
  propertyName: string
  guestName: string
  guestEmail: string
  guestPhone: string
  adults: number
  children: number
  checkIn: string
  checkOut: string
  specialRequests?: string
  source: 'little_hut_direct' | 'stayza_mcp'
  attribution: {
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
    referrer?: string
  }
  quote: StayQuote
  status: BookingStatus
  paymentStatus: 'not_requested' | 'requested' | 'paid' | 'failed'
  holdExpiresAt: string
  accessTokenHash: string
  createdAt: string
  updatedAt: string
}

export interface AvailabilityLock {
  bookingId: string
  bookingReference: string
  propertyId: string
  date: string
  status: 'held' | 'confirmed'
  expiresAt: string
  createdAt: string
}

export interface OwnerApplication {
  id: string
  reference: string
  ownerName: string
  email: string
  phone: string
  propertyName: string
  location: string
  propertyType: string
  bedrooms: number
  maxGuests: number
  operationNotes: string
  status: 'submitted' | 'reviewing' | 'approved' | 'declined'
  createdAt: string
}

export interface BookingRequestInput {
  propertyId: string
  guestName: string
  guestEmail: string
  guestPhone: string
  adults: number
  children: number
  checkIn: string
  checkOut: string
  specialRequests?: string
  source?: 'little_hut_direct' | 'stayza_mcp'
  attribution?: BookingRecord['attribution']
}
