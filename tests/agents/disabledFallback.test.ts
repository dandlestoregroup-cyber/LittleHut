import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import * as mastermind from '../../lib/agents/mastermind'
import { createAgentContext } from '../../lib/agents/permissions'
import { properties } from '../../lib/stayza/catalog'
import { createBooking } from '../../lib/stayza/service'
import { futureDate, setUpTempRecordStore } from './testStore'

setUpTempRecordStore()

beforeEach(() => {
  properties[0].truthStatus = 'verified'
  properties[0].bookingEnabled = true
  properties[0].mediaStatus = 'approved-property'
})

afterEach(() => {
  properties[0].truthStatus = 'joining'
  properties[0].bookingEnabled = false
  properties[0].mediaStatus = 'editorial-teaser'
  delete process.env.AGENTS_ENABLED
})

test('mastermind returns a safe no-op when the agent layer is disabled', async () => {
  process.env.AGENTS_ENABLED = '0'
  const context = createAgentContext('mastermind', 'system')
  const action = await mastermind.route(context, { role: 'guest', phase: 'browsing' })
  assert.equal(action.action, 'wait')
  assert.equal(action.requiresHumanApproval, false)
  assert.match(action.reason, /disabled/i)
})

test('core booking keeps working even while the agent layer is disabled', async () => {
  process.env.AGENTS_ENABLED = '0'
  const result = await createBooking({
    propertyId: 'prop-salty-life-villa',
    guestName: 'Test Guest',
    guestEmail: 'guest@example.com',
    guestPhone: '+20 100 000 0000',
    adults: 2,
    children: 0,
    checkIn: futureDate(70),
    checkOut: futureDate(72),
  })
  assert.equal(result.booking.status, 'requested')
  assert.match(result.booking.reference, /^LHV-\d{8}-[A-F0-9]{6}$/)
})
