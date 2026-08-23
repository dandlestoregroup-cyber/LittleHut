import { randomBytes, randomUUID } from 'node:crypto'
import { getRecordStore } from '../stayza/storage'
import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import type { AgentContext, Evidence } from './types'

export type ExceptionCategory =
  | 'conflicting_property_data'
  | 'missing_owner_authority'
  | 'failed_verification'
  | 'missing_evidence'
  | 'calendar_conflict'
  | 'double_booking_attempt'
  | 'operational_readiness_failure'
  | 'guest_complaint'
  | 'authorization_failure'
  | 'unexpected_booking_condition'

export interface ExceptionRecord {
  id: string
  reference: string
  category: ExceptionCategory
  summary: string
  reason: string
  evidence: Evidence[]
  recommendedAction: string
  responsibleRole: 'guest' | 'owner' | 'scout' | 'operator'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  resolutionState: 'open' | 'resolved' | 'dismissed'
  resolvedAt?: string
  resolutionNotes?: string
}

export class ExceptionNotFoundError extends Error {
  constructor(reference: string) {
    super(`No exception found for reference ${reference}.`)
  }
}

function exceptionPath(reference: string) {
  return `stayza/agents/exceptions/${reference}.json`
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `EXC-${day}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export type CreateExceptionInput = Omit<
  ExceptionRecord,
  'id' | 'reference' | 'createdAt' | 'resolutionState' | 'resolvedAt' | 'resolutionNotes'
>

/**
 * The unified Exceptions Queue. Every entry carries what happened, why it
 * matters, supporting evidence, a recommended action, the responsible role,
 * priority, a timestamp and a resolution state.
 */
export async function createException(
  context: AgentContext,
  input: CreateExceptionInput,
): Promise<ExceptionRecord> {
  assertPermission(context, 'exception:create')
  const record: ExceptionRecord = {
    ...input,
    id: randomUUID(),
    reference: makeReference(),
    createdAt: new Date().toISOString(),
    resolutionState: 'open',
  }
  await getRecordStore().putJson(exceptionPath(record.reference), record)
  await recordAudit(context, {
    trigger: `exception:${input.category}`,
    decision: `Created exception ${record.reference}: ${input.summary}`,
    action: 'exception:create',
    result: 'escalated',
    evidence: input.evidence,
  })
  return record
}

export async function getException(
  context: AgentContext,
  reference: string,
): Promise<ExceptionRecord> {
  assertPermission(context, 'exception:read')
  const record = await getRecordStore().getJson<ExceptionRecord>(
    exceptionPath(reference),
  )
  if (!record) throw new ExceptionNotFoundError(reference)
  return record.value
}

export async function listExceptions(
  context: AgentContext,
): Promise<ExceptionRecord[]> {
  assertPermission(context, 'exception:read')
  const records = await getRecordStore().listJson<ExceptionRecord>(
    'stayza/agents/exceptions/',
  )
  return records.map((record) => record.value)
}

/**
 * One-click resolution, but only for a human-attributed context: resolving
 * an exception is an operator action, not something an automated agent
 * context may trigger on its own.
 */
export async function resolveException(
  context: AgentContext,
  reference: string,
  input: { notes?: string },
): Promise<ExceptionRecord> {
  assertPermission(context, 'exception:resolve')
  if (context.role !== 'operator') {
    throw new Error('Only an operator context may resolve an exception.')
  }
  const record = await getException(context, reference)
  record.resolutionState = 'resolved'
  record.resolvedAt = new Date().toISOString()
  record.resolutionNotes = input.notes
  await getRecordStore().putJson(exceptionPath(reference), record, {
    overwrite: true,
  })
  await recordAudit(context, {
    trigger: `exception:resolve:${record.category}`,
    decision: `Resolved exception ${record.reference}.`,
    action: 'exception:resolve',
    result: 'success',
    humanApprovalIfAny: context.actorId ?? 'operator',
  })
  return record
}
