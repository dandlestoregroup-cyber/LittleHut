import { NextResponse } from 'next/server'
import { apiError, clientIdentity } from '@/lib/stayza/http'
import { enforceRateLimit, getBookingStatus } from '@/lib/stayza/service'
import { bookingStatusSchema } from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const input = bookingStatusSchema.parse(await request.json())
    await enforceRateLimit('booking', `status:${clientIdentity(request)}`, 20)
    const booking = await getBookingStatus(input.reference, input.email)
    if (!booking) {
      return NextResponse.json(
        {
          error: 'No booking matched that reference and email.',
          code: 'booking_not_found',
        },
        { status: 404 },
      )
    }
    return NextResponse.json({ booking })
  } catch (error) {
    return apiError(error)
  }
}
