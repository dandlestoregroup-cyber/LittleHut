import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAgentContext } from '../../lib/agents/permissions'
import * as activationAgent from '../../lib/agents/activation'
import { evaluateReadiness } from '../../lib/agents/activation'
import {
  ACTIVATION_GATES,
  approveActivationForCatalog,
  createActivationRecord,
  IncompleteActivationError,
  markActivationGate,
  MissingHumanApprovalError,
} from '../../lib/stayza/activation'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('an incomplete property cannot be activated', async () => {
  const record = await createActivationRecord('OWNER-20260101-ABCDEF')
  await assert.rejects(
    () =>
      approveActivationForCatalog(record.reference, {
        approvedBy: 'ops@littlehut.example',
        humanApprovalConfirmed: true,
      }),
    IncompleteActivationError,
  )
})

test('activation requiring human approval cannot self-approve', async () => {
  let record = await createActivationRecord('OWNER-20260101-ABCDEF')
  for (const gate of ACTIVATION_GATES) {
    record = await markActivationGate(record.reference, gate, `Evidence for ${gate}`)
  }
  assert.equal(record.status, 'ready_for_approval')

  // Even with every gate complete, an unconfirmed approval is rejected.
  await assert.rejects(
    () =>
      approveActivationForCatalog(record.reference, {
        approvedBy: 'automated-agent',
        humanApprovalConfirmed: false,
      }),
    MissingHumanApprovalError,
  )

  const approved = await approveActivationForCatalog(record.reference, {
    approvedBy: 'ops@littlehut.example',
    humanApprovalConfirmed: true,
  })
  assert.equal(approved.status, 'approved')

  // The Activation Agent's own exposed surface never includes an approval
  // action — architecturally, the agent cannot self-approve.
  assert.equal(
    'approveActivationForCatalog' in (activationAgent as Record<string, unknown>),
    false,
  )
})

test('activation agent evaluates readiness without mutating any gate', async () => {
  const record = await createActivationRecord('OWNER-20260101-ABCDEF')
  const context = createAgentContext('activation', 'system')
  const { readiness } = await evaluateReadiness(context, record.reference)
  assert.equal(readiness.percent, 0)
  assert.equal(readiness.missingGates.length, ACTIVATION_GATES.length)
})
