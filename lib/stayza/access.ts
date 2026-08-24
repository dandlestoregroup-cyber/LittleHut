import type {
  BookingRecord,
  OwnerApplication,
  StayProperty,
} from './types'
import { isPubliclyBookable } from './catalog'

/**
 * Canonical audience-scoped projections.
 *
 * Every surface that returns domain data to a caller — public API routes,
 * server components, the operator console — MUST project through this module
 * rather than hand-rolling its own field list. Previously the "what may this
 * audience see" decision was duplicated inline across several routes and
 * pages, which is precisely how a field leaks: one copy gets a new field and
 * the others drift.
 *
 * Hard invariants enforced here:
 *  - `accessTokenHash` never leaves the server in ANY projection.
 *  - Guest contact details (email/phone/name) are operator-only.
 *  - Commercial internals (base rate, rate periods, minimum suggested rate)
 *    are operator-only, except the single "from" rate on a bookable home.
 *  - A home that is not publicly bookable never exposes capacity or price.
 */

export type Audience = 'public' | 'guest' | 'owner' | 'operator'

/** Fields that must never be serialized to any caller, for any audience. */
const NEVER_EXPOSED = ['accessTokenHash'] as const

export interface PublicPropertyView {
  id: string
  slug: string
  name: string
  location: string
  locationAr: string
  summary: string
  summaryAr: string
  propertyType: StayProperty['propertyType']
  truthStatus: StayProperty['truthStatus']
  bookingEnabled: boolean
  mediaStatus: StayProperty['mediaStatus']
  sourceNote: string
  sourceNoteAr: string
  honestLimitations: string[]
  honestLimitationsAr: string[]
  momentMatches: StayProperty['momentMatches']
  heroImage: string
  gallery: string[]
  features: string[]
  featuresAr: string[]
  description?: string
  descriptionAr?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  minimumNights?: number
  fromRate?: number
  currency?: StayProperty['currency']
}

/**
 * What any unauthenticated visitor may see about a home. Capacity, minimum
 * stay and the "from" rate appear only once the home passes every public
 * truth gate — an unverified home must not look priced or bookable.
 */
export function publicPropertyView(property: StayProperty): PublicPropertyView {
  const bookable = isPubliclyBookable(property)

  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    location: property.location,
    locationAr: property.locationAr,
    summary: property.summary,
    summaryAr: property.summaryAr,
    propertyType: property.propertyType,
    truthStatus: property.truthStatus,
    bookingEnabled: bookable,
    mediaStatus: property.mediaStatus,
    sourceNote: property.sourceNote,
    sourceNoteAr: property.sourceNoteAr,
    honestLimitations: property.honestLimitations,
    honestLimitationsAr: property.honestLimitationsAr,
    momentMatches: property.momentMatches,
    heroImage: property.heroImage,
    gallery: property.gallery,
    features: property.features,
    featuresAr: property.featuresAr,
    ...(bookable
      ? {
          description: property.description,
          descriptionAr: property.descriptionAr,
          maxGuests: property.maxGuests,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          minimumNights: property.minimumNights,
          fromRate: property.minimumSuggestedRate,
          currency: property.currency,
        }
      : {}),
  }
}

/** Operators see the full record, including commercial terms. */
export function operatorPropertyView(property: StayProperty): StayProperty {
  return property
}

export interface GuestBookingView {
  reference: string
  propertyName: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  status: BookingRecord['status']
  paymentStatus: BookingRecord['paymentStatus']
  total: number
  currency: BookingRecord['quote']['currency']
  holdExpiresAt: string
  createdAt: string
}

/**
 * What a guest may see about their OWN booking, after proving the reference
 * plus either the access token or the booking email. Deliberately excludes
 * attribution/marketing data and the access token hash.
 */
export function guestBookingView(booking: BookingRecord): GuestBookingView {
  return {
    reference: booking.reference,
    propertyName: booking.propertyName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.quote.nights,
    guests: booking.adults + booking.children,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    total: booking.quote.total,
    currency: booking.quote.currency,
    holdExpiresAt: booking.holdExpiresAt,
    createdAt: booking.createdAt,
  }
}

export type OperatorBookingView = Omit<BookingRecord, 'accessTokenHash'>

/**
 * Operators see guest contact details and attribution — they have to, to run
 * the stay — but never the access token hash.
 */
export function operatorBookingView(
  booking: BookingRecord,
): OperatorBookingView {
  const { accessTokenHash: _accessTokenHash, ...rest } = booking
  return rest
}

export interface OwnerApplicationStatusView {
  reference: string
  propertyName: string
  status: OwnerApplication['status']
  createdAt: string
}

/**
 * What an owner may see about their OWN submission, after proving reference
 * plus email. Excludes any operator-side assessment.
 */
export function ownerApplicationStatusView(
  application: OwnerApplication,
): OwnerApplicationStatusView {
  return {
    reference: application.reference,
    propertyName: application.propertyName,
    status: application.status,
    createdAt: application.createdAt,
  }
}

export function operatorOwnerApplicationView(
  application: OwnerApplication,
): OwnerApplication {
  return application
}

/**
 * Defence in depth: asserts a payload about to be serialized carries no
 * never-exposed field. Used by the API layer so a future refactor that
 * forgets a projection still fails loudly instead of leaking silently.
 */
export function assertNoSecretFields(payload: unknown, context: string): void {
  const seen = new Set<unknown>()
  const walk = (value: unknown): void => {
    if (value === null || typeof value !== 'object') return
    if (seen.has(value)) return
    seen.add(value)
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    for (const [key, nested] of Object.entries(value)) {
      if ((NEVER_EXPOSED as readonly string[]).includes(key)) {
        throw new Error(
          `Refusing to serialize protected field "${key}" from ${context}.`,
        )
      }
      walk(nested)
    }
  }
  walk(payload)
}
