/**
 * Shared contracts for the Little Hut Mastermind agent layer.
 *
 * The agent layer orchestrates the existing deterministic domain services in
 * `lib/stayza`. It never becomes a second source of truth: every type here
 * either wraps/observes existing domain records or introduces a genuinely new,
 * additive concern (audit trail, exceptions queue, activation intake,
 * journey/next-best-action contracts) that did not previously exist.
 */

export type AgentRole = 'guest' | 'owner' | 'scout' | 'operator' | 'system'

export type AgentName =
  | 'mastermind'
  | 'property-intake'
  | 'scout-qualification'
  | 'activation'
  | 'availability-guardian'
  | 'booking'
  | 'owner-copilot'
  | 'concierge'
  | 'moments'
  | 'exceptions'

/**
 * The exhaustive set of domain-facing capabilities any agent may request.
 * `lib/agents/permissions.ts` decides which agents may use which tools.
 */
export type DomainTool =
  | 'catalog:read'
  | 'owner-application:create'
  | 'owner-application:read'
  | 'activation:read'
  | 'activation:record-evidence'
  | 'availability:read'
  | 'availability:owner-block'
  | 'booking:create'
  | 'booking:read'
  | 'exception:create'
  | 'exception:read'
  | 'exception:resolve'
  | 'audit:write'
  | 'audit:read'

export interface AgentContext {
  agent: AgentName
  role: AgentRole
  requestId: string
  actorId?: string
}

export interface Evidence {
  id: string
  type:
    | 'document'
    | 'photo'
    | 'verification-visit'
    | 'owner-statement'
    | 'system-check'
    | 'guest-statement'
  description: string
  sourceUrl?: string
  capturedAt: string
}

export type NextBestActionType =
  | 'ask'
  | 'collect'
  | 'verify'
  | 'resolve'
  | 'recommend'
  | 'act'
  | 'escalate'
  | 'wait'
  | 'follow_up'

export interface NextBestAction {
  action: NextBestActionType
  reason: string
  owner: AgentRole
  priority: 'low' | 'medium' | 'high' | 'urgent'
  requiresHumanApproval: boolean
  details?: Record<string, unknown>
}

export interface AuditEntry {
  id: string
  agent: AgentName
  trigger: string
  context: Record<string, unknown>
  evidence?: Evidence[]
  decision: string
  action: string
  result: 'success' | 'failure' | 'escalated' | 'no_op'
  humanApprovalIfAny?: string
  timestamp: string
}

export type GuestJourneyState =
  | { role: 'guest'; phase: 'browsing' }
  | { role: 'guest'; phase: 'saved_stay'; propertyId: string }
  | { role: 'guest'; phase: 'booking_pending'; bookingReference: string }
  | { role: 'guest'; phase: 'booking_confirmed'; bookingReference: string }
  | { role: 'guest'; phase: 'during_stay'; bookingReference: string }
  | { role: 'guest'; phase: 'post_stay'; bookingReference: string }

export type OwnerJourneyState =
  | {
      role: 'owner'
      phase: 'missing_activation_requirement'
      activationReference: string
      missingGates: string[]
    }
  | { role: 'owner'; phase: 'calendar_conflict'; propertyId: string }
  | {
      role: 'owner'
      phase: 'upcoming_arrival'
      propertyId: string
      bookingReference: string
    }
  | { role: 'owner'; phase: 'steady_state'; propertyId: string }

export type ScoutJourneyState =
  | {
      role: 'scout'
      phase: 'missing_evidence'
      activationReference: string
      missingGates: string[]
    }
  | {
      role: 'scout'
      phase: 'verification_blocked'
      activationReference: string
      reason: string
    }
  | { role: 'scout'; phase: 'ready_for_approval'; activationReference: string }

export type JourneyState =
  | GuestJourneyState
  | OwnerJourneyState
  | ScoutJourneyState
