import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAgentContext } from '../../lib/agents/permissions'
import { createException, resolveException } from '../../lib/agents/exceptions'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('exception creation works for conflicting property data with full context', async () => {
  const context = createAgentContext('exceptions', 'operator')
  const exception = await createException(context, {
    category: 'conflicting_property_data',
    summary: 'Owner reports 4 bedrooms; verification visit found 3.',
    reason: 'Bedroom count mismatch between owner application and scout visit.',
    evidence: [
      {
        id: 'ev-1',
        type: 'verification-visit',
        description: 'Scout walkthrough photos',
        capturedAt: new Date(0).toISOString(),
      },
    ],
    recommendedAction: 'Confirm the actual bedroom count with the owner before activation.',
    responsibleRole: 'operator',
    priority: 'medium',
  })

  assert.match(exception.reference, /^EXC-\d{8}-[A-F0-9]{6}$/)
  assert.equal(exception.resolutionState, 'open')
  assert.equal(exception.evidence.length, 1)
})

test('an exception can be resolved only by an operator context', async () => {
  const operatorContext = createAgentContext('exceptions', 'operator')
  const exception = await createException(operatorContext, {
    category: 'missing_evidence',
    summary: 'Verification evidence missing.',
    reason: 'No exterior photo captured.',
    evidence: [],
    recommendedAction: 'Scout to capture the exterior photo.',
    responsibleRole: 'scout',
    priority: 'medium',
  })

  const systemContext = createAgentContext('exceptions', 'system')
  await assert.rejects(() =>
    resolveException(systemContext, exception.reference, { notes: 'attempted by automation' }),
  )

  const resolved = await resolveException(operatorContext, exception.reference, {
    notes: 'Owner corrected the listing.',
  })
  assert.equal(resolved.resolutionState, 'resolved')
})
