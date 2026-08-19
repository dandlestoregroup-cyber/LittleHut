import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import {
  AvailabilityError,
  BookingGateError,
  RateLimitError,
} from './service'
import { QuoteError } from './pricing'
import { StorageNotConfiguredError } from './storage'

export function clientIdentity(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Please review the highlighted details.',
        code: 'validation_error',
        fields: error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }
  if (error instanceof QuoteError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 400 },
    )
  }
  if (error instanceof AvailabilityError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'dates_unavailable',
        unavailableDates: error.unavailableDates,
      },
      { status: 409 },
    )
  }
  if (error instanceof BookingGateError) {
    return NextResponse.json(
      { error: error.message, code: 'home_not_bookable' },
      { status: 409 },
    )
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: error.message, code: 'rate_limited' },
      { status: 429 },
    )
  }
  if (error instanceof StorageNotConfiguredError) {
    return NextResponse.json(
      {
        error: 'The booking ledger is temporarily unavailable.',
        code: 'booking_store_unavailable',
      },
      { status: 503 },
    )
  }

  console.error('Stayza API error', error)
  return NextResponse.json(
    { error: 'Something went wrong. Please try again.', code: 'internal_error' },
    { status: 500 },
  )
}
