import { randomUUID } from 'node:crypto'
import { getRecordStore } from '../stayza/storage'
import { assertPermission } from './permissions'
import type { AgentContext, AuditEntry, Evidence } from './types'

function auditPath(id: string, timestamp: string) {
  const day = timestamp.slice(0, 10)
  return `stayza/agents/audit/${day}/${id}.json`
}

export interface RecordAuditInput {
  trigger: string
  decision: string
  action: string
  result: AuditEntry['result']
  evidence?: Evidence[]
  humanApprovalIfAny?: string
  details?: Record<string, unknown>
}

/**
 * Every meaningful agent action is recorded here: agent, trigger, context,
 * evidence, decision, action, result, timestamp, and any human approval
 * involved. This is additive-only storage — it never mutates a domain record.
 */
export async function recordAudit(
  context: AgentContext,
  input: RecordAuditInput,
): Promise<AuditEntry> {
  assertPermission(context, 'audit:write')
  const timestamp = new Date().toISOString()
  const entry: AuditEntry = {
    id: randomUUID(),
    agent: context.agent,
    trigger: input.trigger,
    context: {
      role: context.role,
      requestId: context.requestId,
      actorId: context.actorId,
      ...input.details,
    },
    evidence: input.evidence,
    decision: input.decision,
    action: input.action,
    result: input.result,
    humanApprovalIfAny: input.humanApprovalIfAny,
    timestamp,
  }
  await getRecordStore().putJson(auditPath(entry.id, timestamp), entry)
  return entry
}

export async function listAudit(
  context: AgentContext,
  day?: string,
): Promise<AuditEntry[]> {
  assertPermission(context, 'audit:read')
  const prefix = day
    ? `stayza/agents/audit/${day}/`
    : 'stayza/agents/audit/'
  const records = await getRecordStore().listJson<AuditEntry>(prefix)
  return records.map((record) => record.value)
}
