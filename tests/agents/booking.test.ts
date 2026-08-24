import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import * as bookingAgent from '../../lib/agents/booking'
import { createAgentContext } from '../../lib/agents/permissions'
import { listExceptions } from '../../lib/agents/exceptions'
import { buildQuote } from '../../lib/stayza/pricing'
import { properties } from '../../lib/stayza/catalog'
import { AvailabilityError } from '../../lib/stayza/service'
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
})

test('the booking agent delegates to the authoritative booking service with no reimplemented pricing', async () => {
  const context = createAgentContext('booking', 'guest')
  const input = {
    propertyId: 'prop-salty-life-villa',
    guestName: 'Test Guest',
    guestEmail: 'guest@example.com',
    guestPhone: '+20 100 000 0000',
    adults: 2,
    children: 1,
    checkIn: futureDate(50),
    checkOut: futureDate(53),
  }

  const expectedQuote = buildQuote({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.adults + input.children,
  })

  const result = await bookingAgent.book(context, input)
  assert.match(result.booking.reference, /^LHV-\d{8}-[A-F0-9]{6}$/)
  assert.equal(result.booking.status, 'requested')
  assert.equal(result.booking.quote.total, expectedQuote.total)
  assert.equal(result.nextBestAction.action, 'follow_up')
  assert.equal(result.nextBestAction.requiresHumanApproval, false)
})

test('a double-booking attempt is rejected and queued as an exception, never silently allowed', async () => {
  const context = createAgentContext('booking', 'guest')
  const input = {
    propertyId: 'prop-salty-life-villa',
    guestName: 'Test Guest',
    guestEmail: 'guest@example.com',
    guestPhone: '+20 100 000 0000',
    adults: 2,
    children: 0,
    checkIn: futureDate(60),
    checkOut: futureDate(62),
  }

  await bookingAgent.book(context, input)
  await assert.rejects(
    () => bookingAgent.book(context, { ...input, guestEmail: 'another@example.com' }),
    AvailabilityError,
  )

  const exceptions = await listExceptions(createAgentContext('exceptions', 'operator'))
  assert.ok(exceptions.some((exception) => exception.category === 'double_booking_attempt'))
})
