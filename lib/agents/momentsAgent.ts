import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import type { AgentContext, JourneyState, NextBestAction } from './types'

/**
 * Moments Agent. Given a canonical journey state, returns a deterministic
 * next-best-action so guests, owners and scouts never have to decide which
 * subsystem to visit next.
 */
function resolve(state: JourneyState): NextBestAction {
  if (state.role === 'guest') {
    switch (state.phase) {
      case 'browsing':
        return {
          action: 'recommend',
          reason: 'Continue discovery with matching Moments.',
          owner: 'guest',
          priority: 'low',
          requiresHumanApproval: false,
        }
      case 'saved_stay':
        return {
          action: 'recommend',
          reason: 'Return the guest to their saved stay.',
          owner: 'guest',
          priority: 'medium',
          requiresHumanApproval: false,
          details: { propertyId: state.propertyId },
        }
      case 'booking_pending':
        return {
          action: 'follow_up',
          reason: 'Complete the pending booking request.',
          owner: 'guest',
          priority: 'high',
          requiresHumanApproval: false,
          details: { bookingReference: state.bookingReference },
        }
      case 'booking_confirmed':
        return {
          action: 'act',
          reason: 'Prepare the guest for arrival.',
          owner: 'operator',
          priority: 'medium',
          requiresHumanApproval: false,
          details: { bookingReference: state.bookingReference },
        }
      case 'during_stay':
        return {
          action: 'act',
          reason: 'Surface concierge, guide and experience context.',
          owner: 'guest',
          priority: 'medium',
          requiresHumanApproval: false,
          details: { bookingReference: state.bookingReference },
        }
      case 'post_stay':
        return {
          action: 'follow_up',
          reason: 'Invite a review and preserve the stay as a memory.',
          owner: 'guest',
          priority: 'low',
          requiresHumanApproval: false,
          details: { bookingReference: state.bookingReference },
        }
    }
  }

  if (state.role === 'owner') {
    switch (state.phase) {
      case 'missing_activation_requirement':
        return {
          action: 'collect',
          reason: `Resolve missing activation requirement(s): ${state.missingGates.join(', ')}.`,
          owner: 'owner',
          priority: 'high',
          requiresHumanApproval: false,
          details: { activationReference: state.activationReference },
        }
      case 'calendar_conflict':
        return {
          action: 'resolve',
          reason: 'Fix the calendar conflict before it blocks a booking.',
          owner: 'owner',
          priority: 'urgent',
          requiresHumanApproval: false,
          details: { propertyId: state.propertyId },
        }
      case 'upcoming_arrival':
        return {
          action: 'act',
          reason: 'Prepare the property ahead of the upcoming arrival.',
          owner: 'owner',
          priority: 'high',
          requiresHumanApproval: false,
          details: {
            propertyId: state.propertyId,
            bookingReference: state.bookingReference,
          },
        }
      case 'steady_state':
        return {
          action: 'wait',
          reason: 'No owner action required right now.',
          owner: 'owner',
          priority: 'low',
          requiresHumanApproval: false,
        }
    }
  }

  if (state.role === 'scout') {
    switch (state.phase) {
      case 'missing_evidence':
        return {
          action: 'collect',
          reason: `Capture missing verification evidence: ${state.missingGates.join(', ')}.`,
          owner: 'scout',
          priority: 'high',
          requiresHumanApproval: false,
          details: { activationReference: state.activationReference },
        }
      case 'verification_blocked':
        return {
          action: 'resolve',
          reason: `Resolve the verification blocker: ${state.reason}.`,
          owner: 'scout',
          priority: 'high',
          requiresHumanApproval: false,
          details: { activationReference: state.activationReference },
        }
      case 'ready_for_approval':
        return {
          action: 'escalate',
          reason: 'Property is ready; submit for operator approval.',
          owner: 'operator',
          priority: 'medium',
          requiresHumanApproval: true,
          details: { activationReference: state.activationReference },
        }
    }
  }

  throw new Error('Unhandled journey state.')
}

export async function nextBestAction(
  context: AgentContext,
  state: JourneyState,
): Promise<NextBestAction> {
  assertPermission(context, 'audit:write')
  const result = resolve(state)
  await recordAudit(context, {
    trigger: `moments:${state.role}:${state.phase}`,
    decision: result.reason,
    action: `moments:${result.action}`,
    result: 'success',
  })
  return result
}
