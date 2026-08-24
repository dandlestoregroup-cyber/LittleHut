import { assertPermission } from './permissions'
import { recordAudit } from './audit'
import type { AgentContext } from './types'
import type { OwnerApplication } from '../stayza/types'

/**
 * Scout Qualification Agent. The codebase's closest existing entity to a
 * "lead" is the owner application captured by
 * `lib/stayza/service.ts#createOwnerApplication`, so this agent qualifies
 * leads in terms of that record rather than inventing a parallel scout
 * entity/table.
 */
export interface QualificationResult {
  completenessPercent: number
  duplicateOf?: string
  checklist: string[]
  missingEvidence: string[]
  recommendedAction: 'visit' | 'request_more_info' | 'decline_duplicate'
}

const REQUIRED_EVIDENCE = [
  'exterior_photo',
  'interior_photo',
  'ownership_proof',
  'access_confirmation',
]

const COMPLETENESS_FIELDS: Array<keyof OwnerApplication> = [
  'ownerName',
  'email',
  'phone',
  'propertyName',
  'location',
  'propertyType',
  'bedrooms',
  'maxGuests',
  'operationNotes',
]

export async function qualify(
  context: AgentContext,
  input: {
    application: OwnerApplication
    existingApplications: OwnerApplication[]
    capturedEvidence?: string[]
  },
): Promise<QualificationResult> {
  assertPermission(context, 'owner-application:read')

  const duplicate = input.existingApplications.find(
    (candidate) =>
      candidate.reference !== input.application.reference &&
      (candidate.email.toLowerCase() === input.application.email.toLowerCase() ||
        candidate.phone.replace(/\D/g, '') ===
          input.application.phone.replace(/\D/g, '')),
  )

  const filled = COMPLETENESS_FIELDS.filter((field) => {
    const value = input.application[field]
    return value !== undefined && value !== null && value !== ''
  })
  const completenessPercent = Math.round(
    (filled.length / COMPLETENESS_FIELDS.length) * 100,
  )

  const capturedEvidence = input.capturedEvidence ?? []
  const missingEvidence = REQUIRED_EVIDENCE.filter(
    (item) => !capturedEvidence.includes(item),
  )

  const checklist = [
    'Confirm owner identity matches property ownership records.',
    'Walk the property against the reported bedroom and guest count.',
    'Photograph exterior, interior and access points.',
    'Note any discrepancy between reported and observed condition.',
  ]

  const recommendedAction: QualificationResult['recommendedAction'] = duplicate
    ? 'decline_duplicate'
    : completenessPercent < 100
      ? 'request_more_info'
      : 'visit'

  await recordAudit(context, {
    trigger: 'scout-qualification:qualify',
    decision: duplicate
      ? `Duplicate of application ${duplicate.reference}.`
      : `${completenessPercent}% complete; ${missingEvidence.length} evidence item(s) still missing.`,
    action: 'scout-qualification:assess',
    result: 'success',
  })

  return {
    completenessPercent,
    duplicateOf: duplicate?.reference,
    checklist,
    missingEvidence,
    recommendedAction,
  }
}
