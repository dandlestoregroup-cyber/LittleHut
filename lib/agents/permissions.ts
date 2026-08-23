import { randomUUID } from 'node:crypto'
import type { AgentContext, AgentName, AgentRole, DomainTool } from './types'

export class UnauthorizedAgentActionError extends Error {
  constructor(
    public readonly agent: AgentName,
    public readonly tool: DomainTool,
  ) {
    super(`Agent "${agent}" is not permitted to use domain tool "${tool}".`)
  }
}

/**
 * Explicit least-privilege permission matrix. An agent may only call the
 * domain tools listed here. This table is the single place that decides
 * "what each agent may read and modify" — it is checked on every domain call,
 * not just documented.
 */
const PERMISSIONS: Record<AgentName, DomainTool[]> = {
  mastermind: ['audit:read', 'exception:read'],
  'property-intake': ['owner-application:read', 'audit:write'],
  'scout-qualification': [
    'owner-application:read',
    'audit:write',
    'exception:create',
  ],
  activation: [
    'activation:read',
    'activation:record-evidence',
    'audit:write',
    'exception:create',
  ],
  'availability-guardian': [
    'availability:read',
    'availability:owner-block',
    'audit:write',
    'exception:create',
  ],
  booking: [
    'catalog:read',
    'availability:read',
    'booking:create',
    'booking:read',
    'audit:write',
    'exception:create',
  ],
  'owner-copilot': [
    'activation:read',
    'availability:read',
    'booking:read',
    'audit:write',
  ],
  concierge: ['catalog:read', 'booking:read', 'audit:write', 'exception:create'],
  moments: ['audit:write'],
  exceptions: [
    'exception:create',
    'exception:read',
    'exception:resolve',
    'audit:write',
  ],
}

export function assertPermission(context: AgentContext, tool: DomainTool) {
  const allowed = PERMISSIONS[context.agent] ?? []
  if (!allowed.includes(tool)) {
    throw new UnauthorizedAgentActionError(context.agent, tool)
  }
}

export function createAgentContext(
  agent: AgentName,
  role: AgentRole,
  actorId?: string,
): AgentContext {
  return { agent, role, requestId: randomUUID(), actorId }
}
