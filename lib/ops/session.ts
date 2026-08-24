import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Operator access control for the Little Hut operations console.
 *
 * Deliberately a single shared operator key rather than per-user accounts:
 * the operating company needs a working, auditable console today, and a
 * shared key with signed short-lived sessions is honest about what it is.
 * Per-operator identities are the documented next step, and every agent
 * action already records an actor id so that upgrade is additive.
 *
 * Fails CLOSED: with no OPS_ACCESS_KEY configured, the console and its API
 * refuse every request rather than defaulting open.
 */

const SESSION_COOKIE = 'lh_ops_session'
const SESSION_TTL_HOURS = 12

export class OperatorAuthNotConfiguredError extends Error {
  constructor() {
    super('Operator access is not configured on this deployment.')
  }
}

export function operatorAuthConfigured(): boolean {
  return Boolean(process.env.OPS_ACCESS_KEY?.trim())
}

function accessKey(): string {
  const key = process.env.OPS_ACCESS_KEY?.trim()
  if (!key) throw new OperatorAuthNotConfiguredError()
  return key
}

function signingSecret(): string {
  return process.env.OPS_SESSION_SECRET?.trim() || `derived:${accessKey()}`
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) {
    // Still perform a comparison so length differences do not short-circuit
    // measurably faster than a value mismatch.
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}

export function verifyAccessKey(candidate: string): boolean {
  if (!operatorAuthConfigured()) return false
  return safeEqual(candidate.trim(), accessKey())
}

function sign(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('base64url')
}

export interface OperatorSession {
  actorId: string
  issuedAt: number
  expiresAt: number
}

export function createSessionToken(actorId?: string): string {
  const now = Date.now()
  const session: OperatorSession = {
    actorId: actorId?.trim() || `operator-${randomBytes(4).toString('hex')}`,
    issuedAt: now,
    expiresAt: now + SESSION_TTL_HOURS * 60 * 60 * 1000,
  }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): OperatorSession | null {
  if (!token || !operatorAuthConfigured()) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  if (!safeEqual(signature, sign(payload))) return null

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as OperatorSession
    if (typeof session.expiresAt !== 'number' || session.expiresAt < Date.now()) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export const operatorSessionCookie = {
  name: SESSION_COOKIE,
  maxAgeSeconds: SESSION_TTL_HOURS * 60 * 60,
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

/** Returns the operator session for a request, or null when unauthenticated. */
export function operatorSessionFromRequest(
  request: Request,
): OperatorSession | null {
  return verifySessionToken(
    readCookie(request.headers.get('cookie'), SESSION_COOKIE),
  )
}
