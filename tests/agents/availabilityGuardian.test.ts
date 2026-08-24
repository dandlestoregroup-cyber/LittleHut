import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { createAgentContext } from '../../lib/agents/permissions'
import { addOwnerBlock, reconcile, releaseOwnerBlock } from '../../lib/agents/availabilityGuardian'
import { listExceptions } from '../../lib/agents/exceptions'
import { properties } from '../../lib/stayza/catalog'
import { AvailabilityError, createBooking, createOwnerBlock } from '../../lib/stayza/service'
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

test('releasing an owner block never deletes a guest booking lock on the same date', async () => {
  // Regression test: releaseOwnerBlock previously deleted whatever lock sat
  // at a date's shared lock path, so releasing a stale/mistaken owner block
  // could silently free a guest's confirmed booking night.
  const context = createAgentContext('availability-guardian', 'owner')
  const booking = await createBooking({
    propertyId: 'prop-salty-life-villa',
    guestName: 'Guest',
    guestEmail: 'guest@example.com',
    guestPhone: '+20 100 000 0000',
    adults: 2,
    children: 0,
    checkIn: futureDate(80),
    checkOut: futureDate(82),
  })
  assert.equal(booking.booking.status, 'requested')

  // Attempting to block the same nights fails because the guest hold is
  // already there — exactly as it should.
  await assert.rejects(
    () =>
      createOwnerBlock({
        propertyId: 'prop-salty-life-villa',
        checkIn: futureDate(80),
        checkOut: futureDate(82),
      }),
    AvailabilityError,
  )

  // A mistaken/retried release for those same dates must not touch the
  // guest's lock.
  await releaseOwnerBlock(context, 'prop-salty-life-villa', [futureDate(80), futureDate(81)])

  const availability = await reconcile(context, {
    propertyId: 'prop-salty-life-villa',
    checkIn: futureDate(80),
    checkOut: futureDate(82),
    guests: 2,
  })
  assert.equal(availability.available, false)
  assert.deepEqual(availability.unavailableDates, [futureDate(80), futureDate(81)])
})
