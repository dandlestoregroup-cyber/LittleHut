import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { activationReadiness, type ActivationRecord } from '../stayza/activation'
import type { AgentContext, NextBestAction } from './types'
import type { StayProperty } from '../stayza/types'

const PRIORITY_WEIGHT: Record<NextBestAction['priority'], number> = {
  urgent: 3,
  high: 2,
  medium: 1,
  low: 0,
}

/**
 * Owner Copilot. Prefers surfacing exactly one clear action over a dashboard
 * of passive information, as specified.
 */
export async function nextActions(
  context: AgentContext,
  input: { property: StayProperty; activation?: ActivationRecord },
): Promise<NextBestAction[]> {
  assertPermission(context, 'activation:read')
  const actions: NextBestAction[] = []

  if (input.activation) {
    const readiness = activationReadiness(input.activation)
    if (readiness.missingGates.length > 0) {
      actions.push({
        action: 'collect',
        reason: `Activation is ${readiness.percent}% complete. Missing: ${readiness.missingGates.join(', ')}.`,
        owner: 'owner',
        priority: 'high',
        requiresHumanApproval: false,
        details: { missingGates: readiness.missingGates },
      })
    } else if (input.activation.status === 'ready_for_approval') {
      actions.push({
        action: 'wait',
        reason: 'All activation gates are complete; awaiting operator approval.',
        owner: 'operator',
        priority: 'medium',
        requiresHumanApproval: true,
      })
    }
  }

  if (
    !input.property.bookingEnabled ||
    input.property.truthStatus !== 'verified' ||
    input.property.mediaStatus !== 'approved-property'
  ) {
    actions.push({
      action: 'follow_up',
      reason: 'This home is not yet open for direct booking.',
      owner: 'operator',
      priority: 'medium',
      requiresHumanApproval: true,
    })
  }

  if (actions.length === 0) {
    actions.push({
      action: 'wait',
      reason: 'No owner action required right now.',
      owner: 'owner',
      priority: 'low',
      requiresHumanApproval: false,
    })
  }

  actions.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority])

  await recordAudit(context, {
    trigger: 'owner-copilot:next-actions',
    decision: `Surfaced ${actions.length} candidate action(s); returning the single highest-priority one.`,
    action: 'owner-copilot:recommend',
    result: 'success',
  })

  return actions.slice(0, 1)
}
