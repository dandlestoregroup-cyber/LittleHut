import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import { ownerApplicationSchema } from '../stayza/validation'
import type { AgentContext } from './types'

const REQUIRED_FIELDS = [
  'ownerName',
  'email',
  'phone',
  'propertyName',
  'location',
  'propertyType',
  'bedrooms',
  'maxGuests',
  'operationNotes',
] as const

type RequiredField = (typeof REQUIRED_FIELDS)[number]

export type RawPropertySubmission = Partial<Record<RequiredField, unknown>>

export interface IntakeResult {
  normalized: Partial<Record<RequiredField, string | number>>
  missingFields: RequiredField[]
  contradictions: string[]
  readyForApplication: boolean
}

const PROPERTY_TYPES = ['villa', 'chalet', 'apartment', 'other']

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return parseInt(value.trim(), 10)
  }
  return undefined
}

/**
 * Property Intake Agent. It only ever writes a field into `normalized` when
 * the raw submission genuinely contains it — there is no fallback/default
 * value logic anywhere in this function, so an agent can never fabricate a
 * property fact the owner (or scout) did not actually provide.
 */
export async function processIntake(
  context: AgentContext,
  raw: RawPropertySubmission,
): Promise<IntakeResult> {
  assertPermission(context, 'owner-application:read')

  const normalized: IntakeResult['normalized'] = {}
  const contradictions: string[] = []

  const ownerName = normalizeString(raw.ownerName)
  if (ownerName) normalized.ownerName = ownerName

  const email = normalizeString(raw.email)
  if (email) normalized.email = email.toLowerCase()

  const phone = normalizeString(raw.phone)
  if (phone) normalized.phone = phone

  const propertyName = normalizeString(raw.propertyName)
  if (propertyName) normalized.propertyName = propertyName

  const location = normalizeString(raw.location)
  if (location) normalized.location = location

  const propertyType = normalizeString(raw.propertyType)
  if (propertyType) {
    const lower = propertyType.toLowerCase()
    if (PROPERTY_TYPES.includes(lower)) {
      normalized.propertyType = lower
    } else {
      contradictions.push(`Unrecognized property type "${propertyType}".`)
    }
  }

  const bedrooms = normalizeInt(raw.bedrooms)
  if (bedrooms !== undefined) normalized.bedrooms = bedrooms

  const maxGuests = normalizeInt(raw.maxGuests)
  if (maxGuests !== undefined) normalized.maxGuests = maxGuests

  if (bedrooms !== undefined && maxGuests !== undefined && maxGuests < bedrooms) {
    contradictions.push(
      'Reported max guests is lower than reported bedroom count; please confirm capacity.',
    )
  }

  const operationNotes = normalizeString(raw.operationNotes)
  if (operationNotes) normalized.operationNotes = operationNotes

  // Re-use the exact bounds the domain layer enforces at submission time
  // (lib/stayza/validation.ts#ownerApplicationSchema) rather than duplicating
  // them here, so a field that intake calls "ready" always actually is.
  for (const field of REQUIRED_FIELDS) {
    const value = normalized[field]
    if (value === undefined) continue
    const fieldSchema = ownerApplicationSchema.shape[field]
    const result = fieldSchema.safeParse(value)
    if (!result.success) {
      contradictions.push(
        `Reported ${field} "${value}" does not meet the accepted format or range.`,
      )
    }
  }

  const missingFields = REQUIRED_FIELDS.filter(
    (field) => normalized[field] === undefined,
  )

  await recordAudit(context, {
    trigger: 'property-intake:process',
    decision: `Normalized ${REQUIRED_FIELDS.length - missingFields.length}/${REQUIRED_FIELDS.length} known field(s).`,
    action: 'owner-application:normalize',
    result: missingFields.length === 0 && contradictions.length === 0 ? 'success' : 'no_op',
    details: { missingFields, contradictions },
  })

  return {
    normalized,
    missingFields,
    contradictions,
    readyForApplication: missingFields.length === 0 && contradictions.length === 0,
  }
}
