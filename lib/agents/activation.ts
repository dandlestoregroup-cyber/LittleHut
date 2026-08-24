import { randomUUID } from 'node:crypto'
import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { createException } from './exceptions'
import {
  activationReadiness,
  getActivationRecord,
  markActivationGate,
  type ActivationGate,
} from '../stayza/activation'
import type { AgentContext } from './types'

/**
 * The Activation Agent. Note what is deliberately absent from this module:
 * there is no function here that approves an activation record. Approval
 * lives only in `lib/stayza/activation.ts#approveActivationForCatalog`,
 * which requires an explicit human-confirmed flag this agent never sets.
 * A property can never become Active merely because this agent decides it
 * should.
 */
export async function evaluateReadiness(
  context: AgentContext,
  reference: string,
) {
  assertPermission(context, 'activation:read')
  const record = await getActivationRecord(reference)
  const readiness = activationReadiness(record)
  await recordAudit(context, {
    trigger: 'activation:evaluate',
    decision: `${readiness.percent}% complete; missing: ${
      readiness.missingGates.join(', ') || 'none'
    }.`,
    action: 'activation:evaluate-readiness',
    result: 'success',
  })
  return { record, readiness }
}

export async function recordEvidence(
  context: AgentContext,
  reference: string,
  gate: ActivationGate,
  evidenceDescription: string,
) {
  assertPermission(context, 'activation:record-evidence')
  const record = await markActivationGate(reference, gate, evidenceDescription)
  await recordAudit(context, {
    trigger: 'activation:record-evidence',
    decision: `Recorded evidence for gate "${gate}".`,
    action: 'activation:mark-gate',
    result: 'success',
    evidence: [
      {
        id: randomUUID(),
        type: 'document',
        description: evidenceDescription,
        capturedAt: new Date().toISOString(),
      },
    ],
  })
  return record
}

export async function flagContradiction(
  context: AgentContext,
  summary: string,
  reason: string,
) {
  return createException(context, {
    category: 'conflicting_property_data',
    summary,
    reason,
    evidence: [],
    recommendedAction:
      'Operator to review the activation record and reconcile owner-provided data.',
    responsibleRole: 'operator',
    priority: 'medium',
  })
}
