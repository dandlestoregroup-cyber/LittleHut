import { NextResponse } from 'next/server'
import { apiError, clientIdentity } from '@/lib/stayza/http'
import { createBooking, enforceRateLimit } from '@/lib/stayza/service'
import { bookingRequestSchema } from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const input = bookingRequestSchema.parse(await request.json())
    await enforceRateLimit('booking', clientIdentity(request), 5)
    const { consent: _consent, website: _website, ...bookingInput } = input
    const result = await createBooking(bookingInput)

    return NextResponse.json(
      {
        booking: {
          reference: result.booking.reference,
          propertyName: result.booking.propertyName,
          checkIn: result.booking.checkIn,
          checkOut: result.booking.checkOut,
          status: result.booking.status,
          total: result.booking.quote.total,
          currency: result.booking.quote.currency,
          holdExpiresAt: result.booking.holdExpiresAt,
        },
        statusUrl: `/booking/${result.booking.reference}?token=${encodeURIComponent(
          result.accessToken,
        )}`,
      },
      { status: 201 },
    )
  } catch (error) {
    return apiError(error)
  }
}
