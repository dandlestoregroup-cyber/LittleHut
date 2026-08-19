import { getBookablePropertyById } from './catalog'
import type { QuoteNight, StayProperty, StayQuote } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_BOOKING_NIGHTS = 30

export class QuoteError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'invalid_dates'
      | 'past_date'
      | 'stay_too_long'
      | 'minimum_stay'
      | 'guest_capacity'
      | 'property_not_found',
  ) {
    super(message)
  }
}

export function dateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`)
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new QuoteError('Please enter valid check-in and check-out dates.', 'invalid_dates')
  }
  return date
}

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export function stayDates(checkIn: string, checkOut: string): string[] {
  const start = dateOnly(checkIn)
  const end = dateOnly(checkOut)
  if (end.getTime() <= start.getTime()) {
    throw new QuoteError('Check-out must be after check-in.', 'invalid_dates')
  }
  if (checkIn < todayUtc()) {
    throw new QuoteError('Check-in cannot be in the past.', 'past_date')
  }

  const nights = Math.round((end.getTime() - start.getTime()) / DAY_MS)
  if (nights > MAX_BOOKING_NIGHTS) {
    throw new QuoteError(
      `Online stays are limited to ${MAX_BOOKING_NIGHTS} nights.`,
      'stay_too_long',
    )
  }

  return Array.from({ length: nights }, (_, index) =>
    new Date(start.getTime() + index * DAY_MS).toISOString().slice(0, 10),
  )
}

function rateForDate(property: StayProperty, date: string): QuoteNight {
  const period = property.ratePeriods.find(
    (candidate) => date >= candidate.start && date <= candidate.end,
  )
  const configuredRate = period?.nightlyRate ?? property.baseNightlyRate
  const rate = Math.max(configuredRate, property.minimumSuggestedRate)

  return {
    date,
    rate,
    rateLabel: period?.label ?? 'Current direct rate',
  }
}

export function buildQuote(input: {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
}): StayQuote {
  const property = getBookablePropertyById(input.propertyId)
  if (!property) {
    throw new QuoteError('This stay is not available for direct booking.', 'property_not_found')
  }
  if (!Number.isInteger(input.guests) || input.guests < 1) {
    throw new QuoteError('Please enter at least one guest.', 'guest_capacity')
  }
  if (input.guests > property.maxGuests) {
    throw new QuoteError(
      `${property.name} accommodates up to ${property.maxGuests} guests.`,
      'guest_capacity',
    )
  }

  const dates = stayDates(input.checkIn, input.checkOut)
  const requiredMinimum = Math.max(
    property.minimumNights,
    ...dates.map(
      (date) =>
        property.ratePeriods.find(
          (period) => date >= period.start && date <= period.end,
        )?.minimumNights ?? 1,
    ),
  )

  if (dates.length < requiredMinimum) {
    throw new QuoteError(
      `The minimum stay for these dates is ${requiredMinimum} nights.`,
      'minimum_stay',
    )
  }

  const nightly = dates.map((date) => rateForDate(property, date))
  const accommodationTotal = nightly.reduce((sum, night) => sum + night.rate, 0)

  return {
    propertyId: property.id,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.guests,
    nights: dates.length,
    nightly,
    accommodationTotal,
    feesTotal: 0,
    total: accommodationTotal,
    currency: property.currency,
    minimumNights: requiredMinimum,
  }
}

export function formatEgp(value: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}
