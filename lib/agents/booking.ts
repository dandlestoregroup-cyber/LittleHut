import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { createException } from './exceptions'
import {
  AvailabilityError,
  BookingGateError,
  createBooking,
  getAvailability,
} from '../stayza/service'
import { getPropertyById } from '../stayza/catalog'
import type { AgentContext, NextBestAction } from './types'
import type { BookingRequestInput } from '../stayza/types'

/**
 * Booking Agent. It re-checks status and availability, then delegates the
 * actual reservation to `lib/stayza/service.ts#createBooking` — the single
 * authoritative booking service. No pricing, date, or capacity rule is
 * reimplemented here.
 */
export async function book(context: AgentContext, input: BookingRequestInput) {
  assertPermission(context, 'catalog:read')
  assertPermission(context, 'availability:read')
  assertPermission(context, 'booking:create')

  const property = getPropertyById(input.propertyId)
  if (!property) {
    await createException(context, {
      category: 'unexpected_booking_condition',
      summary: `Booking attempted for unknown property ${input.propertyId}.`,
      reason: 'The supplied property id does not exist in the catalog.',
      evidence: [],
      recommendedAction: 'Verify the property id supplied by the caller.',
      responsibleRole: 'operator',
      priority: 'medium',
    })
    throw new BookingGateError()
  }

  const availability = await getAvailability({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.adults + input.children,
  })
  if (!availability.available) {
    await recordAudit(context, {
      trigger: 'booking:pre-check',
      decision: `Requested dates are unavailable: ${availability.unavailableDates.join(', ')}.`,
      action: 'availability:read',
      result: 'no_op',
    })
  }

  try {
    const result = await createBooking(input)
    await recordAudit(context, {
      trigger: 'booking:create',
      decision: `Booking ${result.booking.reference} created for ${property.name}.`,
      action: 'booking:create',
      result: 'success',
    })
    const nextBestAction: NextBestAction = {
      action: 'follow_up',
      reason: 'Booking requested; prepare concierge and owner arrival context.',
      owner: 'operator',
      priority: 'medium',
      requiresHumanApproval: false,
      details: { bookingReference: result.booking.reference },
    }
    return { ...result, nextBestAction }
  } catch (error) {
    if (error instanceof AvailabilityError) {
      await createException(context, {
        category: 'double_booking_attempt',
        summary: `Booking attempt for ${property.name} conflicted with existing held or confirmed nights.`,
        reason: error.message,
        evidence: [],
        recommendedAction:
          'No operator action required; offer the guest alternative dates.',
        responsibleRole: 'operator',
        priority: 'low',
      })
    }
    await recordAudit(context, {
      trigger: 'booking:create',
      decision: `Booking failed: ${(error as Error).message}`,
      action: 'booking:create',
      result: 'failure',
    })
    throw error
  }
}
