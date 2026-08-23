import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { createAgentContext } from '../../lib/agents/permissions'
import { addOwnerBlock, reconcile } from '../../lib/agents/availabilityGuardian'
import { listExceptions } from '../../lib/agents/exceptions'
import { properties } from '../../lib/stayza/catalog'
import { AvailabilityError, createBooking } from '../../lib/stayza/service'
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

test('owner-blocked dates remain unavailable to guests', async () => {
  const context = createAgentContext('availability-guardian', 'owner')
  await addOwnerBlock(context, {
    propertyId: 'prop-salty-life-villa',
    checkIn: futureDate(30),
    checkOut: futureDate(33),
    reason: 'Owner family stay',
  })

  const availability = await reconcile(context, {
    propertyId: 'prop-salty-life-villa',
    checkIn: futureDate(30),
    checkOut: futureDate(33),
    guests: 2,
  })
  assert.equal(availability.available, false)
  assert.deepEqual(availability.unavailableDates, [
    futureDate(30),
    futureDate(31),
    futureDate(32),
  ])

  await assert.rejects(
    () =>
      createBooking({
        propertyId: 'prop-salty-life-villa',
        guestName: 'Guest',
        guestEmail: 'guest@example.com',
        guestPhone: '+20 100 000 0000',
        adults: 2,
        children: 0,
        checkIn: futureDate(30),
        checkOut: futureDate(33),
      }),
    AvailabilityError,
  )
})

test('a conflicting owner block request raises a queued exception', async () => {
  const context = createAgentContext('availability-guardian', 'owner')
  await addOwnerBlock(context, {
    propertyId: 'prop-salty-life-villa',
    checkIn: futureDate(40),
    checkOut: futureDate(42),
  })

  await assert.rejects(
    () =>
      addOwnerBlock(context, {
        propertyId: 'prop-salty-life-villa',
        checkIn: futureDate(41),
        checkOut: futureDate(43),
      }),
    AvailabilityError,
  )

  const exceptions = await listExceptions(createAgentContext('exceptions', 'operator'))
  assert.ok(exceptions.some((exception) => exception.category === 'double_booking_attempt'))
})
