import { randomBytes, randomUUID } from 'node:crypto'
import { getRecordStore } from './storage'

/**
 * Activation intake pipeline: Captured -> Owner Confirmed -> Details
 * Completed -> Verification -> Calendar Connected -> Ready for Approval ->
 * Approved. This tracks a property candidate (referencing an owner
 * application) on its way toward being hand-added to the live catalog in
 * `lib/stayza/catalog.ts`. It never touches the catalog itself: the catalog
 * remains a source-controlled, human-reviewed file, which is the ultimate
 * protection against an agent silently publishing a home.
 */
export type ActivationGate =
  | 'owner_confirmed'
  | 'details_completed'
  | 'verification_evidence'
  | 'calendar_connected'
  | 'media_approved'

export const ACTIVATION_GATES: ActivationGate[] = [
  'owner_confirmed',
  'details_completed',
  'verification_evidence',
  'calendar_connected',
  'media_approved',
]

export interface ActivationGateState {
  complete: boolean
  evidenceDescription?: string
  completedAt?: string
}

export interface ActivationRecord {
  id: string
  reference: string
  ownerApplicationReference: string
  gates: Record<ActivationGate, ActivationGateState>
  status: 'in_progress' | 'ready_for_approval' | 'approved'
  approvedBy?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export class ActivationNotFoundError extends Error {
  constructor(reference: string) {
    super(`No activation record found for ${reference}.`)
  }
}

export class IncompleteActivationError extends Error {
  constructor(public readonly missingGates: ActivationGate[]) {
    super(
      `Activation is missing required gate(s): ${missingGates.join(', ')}.`,
    )
  }
}

export class MissingHumanApprovalError extends Error {
  constructor() {
    super('Activation approval requires explicit, confirmed human approval.')
  }
}

function path(reference: string) {
  return `stayza/agents/activation/${reference}.json`
}

function makeReference() {
  const day = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `ACT-${day}-${randomBytes(3).toString('hex').toUpperCase()}`
}

function emptyGates(): ActivationRecord['gates'] {
  return Object.fromEntries(
    ACTIVATION_GATES.map((gate) => [gate, { complete: false }]),
  ) as ActivationRecord['gates']
}

export async function createActivationRecord(
  ownerApplicationReference: string,
): Promise<ActivationRecord> {
  const now = new Date().toISOString()
  const record: ActivationRecord = {
    id: randomUUID(),
    reference: makeReference(),
    ownerApplicationReference,
    gates: emptyGates(),
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  }
  await getRecordStore().putJson(path(record.reference), record)
  return record
}

export async function getActivationRecord(
  reference: string,
): Promise<ActivationRecord> {
  const record = await getRecordStore().getJson<ActivationRecord>(
    path(reference),
  )
  if (!record) throw new ActivationNotFoundError(reference)
  return record.value
}

export function activationReadiness(record: ActivationRecord) {
  const missingGates = ACTIVATION_GATES.filter(
    (gate) => !record.gates[gate].complete,
  )
  const percent = Math.round(
    ((ACTIVATION_GATES.length - missingGates.length) /
      ACTIVATION_GATES.length) *
      100,
  )
  return {
    percent,
    missingGates,
    readyForApproval: missingGates.length === 0 && record.status !== 'approved',
  }
}

export async function markActivationGate(
  reference: string,
  gate: ActivationGate,
  evidenceDescription: string,
): Promise<ActivationRecord> {
  const record = await getActivationRecord(reference)
  if (record.status === 'approved') {
    throw new Error('Cannot modify an approved activation record.')
  }
  record.gates[gate] = {
    complete: true,
    evidenceDescription,
    completedAt: new Date().toISOString(),
  }
  const readiness = activationReadiness(record)
  record.status =
    readiness.missingGates.length === 0 ? 'ready_for_approval' : 'in_progress'
  record.updatedAt = new Date().toISOString()
  await getRecordStore().putJson(path(reference), record, { overwrite: true })
  return record
}

/**
 * The only function that can move an activation record to "approved". It
 * requires every gate to be complete AND an explicit, caller-supplied
 * `humanApprovalConfirmed: true` — a flag no agent context can set on a
 * human's behalf. `lib/agents/activation.ts` deliberately never calls or
 * re-exports this function.
 */
export async function approveActivationForCatalog(
  reference: string,
  input: { approvedBy: string; humanApprovalConfirmed: boolean },
): Promise<ActivationRecord> {
  const record = await getActivationRecord(reference)
  const readiness = activationReadiness(record)
  if (readiness.missingGates.length > 0) {
    throw new IncompleteActivationError(readiness.missingGates)
  }
  if (input.humanApprovalConfirmed !== true) {
    throw new MissingHumanApprovalError()
  }
  record.status = 'approved'
  record.approvedBy = input.approvedBy
  record.approvedAt = new Date().toISOString()
  record.updatedAt = record.approvedAt
  await getRecordStore().putJson(path(reference), record, { overwrite: true })
  return record
}
