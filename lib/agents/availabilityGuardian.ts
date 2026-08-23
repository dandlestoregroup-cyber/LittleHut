import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { createException } from './exceptions'
import {
  AvailabilityError,
  createOwnerBlock,
  getAvailability,
  removeOwnerBlock,
} from '../stayza/service'
import type { AgentContext } from './types'

/**
 * Availability Guardian. It never recomputes availability itself — every
 * check here delegates to `lib/stayza/service.ts#getAvailability`, the one
 * authoritative source. This module only adds reconciliation, exception
 * surfacing, and an owner-blocking capability built on the same lock
 * primitives bookings use.
 */
export async function reconcile(
  context: AgentContext,
  input: { propertyId: string; checkIn: string; checkOut: string; guests: number },
) {
  assertPermission(context, 'availability:read')
  const result = await getAvailability(input)
  await recordAudit(context, {
    trigger: 'availability:reconcile',
    decision: result.available
      ? 'Requested dates are available.'
      : `Blocked dates: ${result.unavailableDates.join(', ')}.`,
    action: 'availability:read',
    result: 'success',
  })
  return result
}

export async function addOwnerBlock(
  context: AgentContext,
  input: { propertyId: string; checkIn: string; checkOut: string; reason?: string },
) {
  assertPermission(context, 'availability:owner-block')
  try {
    const block = await createOwnerBlock(input)
    await recordAudit(context, {
      trigger: 'availability:owner-block',
      decision: `Blocked ${block.dates.length} night(s) for property ${input.propertyId}.`,
      action: 'availability:create-owner-block',
      result: 'success',
    })
    return block
  } catch (error) {
    if (error instanceof AvailabilityError) {
      await createException(context, {
        category: 'double_booking_attempt',
        summary: `Owner block requested for ${input.propertyId} conflicts with existing held or confirmed nights.`,
        reason: error.message,
        evidence: [],
        recommendedAction:
          'Operator to confirm with the owner which dates are already committed before blocking.',
        responsibleRole: 'operator',
        priority: 'high',
      })
    }
    throw error
  }
}

export async function releaseOwnerBlock(
  context: AgentContext,
  propertyId: string,
  dates: string[],
) {
  assertPermission(context, 'availability:owner-block')
  await removeOwnerBlock(propertyId, dates)
  await recordAudit(context, {
    trigger: 'availability:release-owner-block',
    decision: `Released ${dates.length} previously blocked night(s) for ${propertyId}.`,
    action: 'availability:remove-owner-block',
    result: 'success',
  })
}
