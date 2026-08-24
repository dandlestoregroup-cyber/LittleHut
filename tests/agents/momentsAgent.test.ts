import assert from 'node:assert/strict'
import { test } from 'node:test'
import * as momentsAgent from '../../lib/agents/momentsAgent'
import { createAgentContext } from '../../lib/agents/permissions'
import { setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

test('moments returns the correct deterministic next-best action for major guest states', async () => {
  const context = createAgentContext('moments', 'system')

  const browsing = await momentsAgent.nextBestAction(context, { role: 'guest', phase: 'browsing' })
  assert.equal(browsing.action, 'recommend')

  const pending = await momentsAgent.nextBestAction(context, {
    role: 'guest',
    phase: 'booking_pending',
    bookingReference: 'LHV-1',
  })
  assert.equal(pending.action, 'follow_up')

  const duringStay = await momentsAgent.nextBestAction(context, {
    role: 'guest',
    phase: 'during_stay',
    bookingReference: 'LHV-1',
  })
  assert.equal(duringStay.action, 'act')

  const postStay = await momentsAgent.nextBestAction(context, {
    role: 'guest',
    phase: 'post_stay',
    bookingReference: 'LHV-1',
  })
  assert.equal(postStay.action, 'follow_up')
})

test('moments returns the correct deterministic next-best action for owner and scout states', async () => {
  const context = createAgentContext('moments', 'system')

  const ownerMissing = await momentsAgent.nextBestAction(context, {
    role: 'owner',
    phase: 'missing_activation_requirement',
    activationReference: 'ACT-1',
    missingGates: ['media_approved'],
  })
  assert.equal(ownerMissing.action, 'collect')

  const ownerCalendar = await momentsAgent.nextBestAction(context, {
    role: 'owner',
    phase: 'calendar_conflict',
    propertyId: 'prop-1',
  })
  assert.equal(ownerCalendar.priority, 'urgent')

  const scoutReady = await momentsAgent.nextBestAction(context, {
    role: 'scout',
    phase: 'ready_for_approval',
    activationReference: 'ACT-1',
  })
  assert.equal(scoutReady.action, 'escalate')
  assert.equal(scoutReady.requiresHumanApproval, true)
})
