import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, test } from 'node:test'
import { buildQuote, QuoteError } from '../lib/stayza/pricing'
import { properties } from '../lib/stayza/catalog'
import {
  AvailabilityError,
  createBooking,
  createOwnerApplication,
  getAvailability,
  getBookingByAccess,
  getBookingStatus,
} from '../lib/stayza/service'
import { resetRecordStoreForTests } from '../lib/stayza/storage'

let dataDirectory = ''

function futureDate(days: number) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

beforeEach(async () => {
  dataDirectory = await mkdtemp(path.join(tmpdir(), 'stayza-test-'))
  process.env.STAYZA_DATA_DIR = dataDirectory
  process.env.STAYZA_ALLOW_FILE_STORE = '1'
  delete process.env.VERCEL
  resetRecordStoreForTests()
  properties[0].truthStatus = 'verified'
  properties[0].bookingEnabled = true
  properties[0].mediaStatus = 'approved-property'
})

afterEach(async () => {
  resetRecordStoreForTests()
  properties[0].truthStatus = 'joining'
  properties[0].bookingEnabled = false
  properties[0].mediaStatus = 'editorial-teaser'
  await rm(dataDirectory, { recursive: true, force: true })
})

test('blocks quotes and booking requests until every public truth gate passes', async () => {
  properties[0].truthStatus = 'joining'
  properties[0].bookingEnabled = false
  properties[0].mediaStatus = 'editorial-teaser'

  assert.throws(
    () =>
      buildQuote({
        propertyId: 'prop-salty-life-villa',
        checkIn: futureDate(10),
        checkOut: futureDate(12),
        guests: 2,
      }),
    (error) =>
      error instanceof QuoteError && error.code === 'property_not_found',
  )

  await assert.rejects(
    () =>
      createBooking({
        propertyId: 'prop-salty-life-villa',
        guestName: 'Test Guest',
        guestEmail: 'guest@example.com',
        guestPhone: '+20 100 000 0000',
        adults: 2,
        children: 0,
        checkIn: futureDate(20),
        checkOut: futureDate(22),
      }),
    /not verified and open for booking/i,
  )
})

test('builds the authoritative EGP quote and enforces the minimum stay', () => {
  const quote = buildQuote({
    propertyId: 'prop-salty-life-villa',
    checkIn: futureDate(10),
    checkOut: futureDate(12),
    guests: 4,
  })
  assert.equal(quote.nights, 2)
  assert.equal(quote.accommodationTotal, 14000)
  assert.equal(quote.total, 14000)
  assert.equal(quote.currency, 'EGP')

  assert.throws(
    () =>
      buildQuote({
        propertyId: 'prop-salty-life-villa',
        checkIn: futureDate(10),
        checkOut: futureDate(11),
        guests: 2,
      }),
    (error) => error instanceof QuoteError && error.code === 'minimum_stay',
  )
})

test('creates a central booking record and prevents overlapping requests', async () => {
  const input = {
    propertyId: 'prop-salty-life-villa',
    guestName: 'Test Guest',
    guestEmail: 'guest@example.com',
    guestPhone: '+20 100 000 0000',
    adults: 2,
    children: 1,
    checkIn: futureDate(20),
    checkOut: futureDate(23),
    source: 'little_hut_direct' as const,
  }
  const first = await createBooking(input)
  assert.match(first.booking.reference, /^LHV-\d{8}-[A-F0-9]{6}$/)
  assert.equal(first.booking.status, 'requested')
  assert.equal(first.booking.quote.total, 21000)

  const authenticated = await getBookingByAccess(
    first.booking.reference,
    first.accessToken,
  )
  assert.equal(authenticated?.guestEmail, 'guest@example.com')

  const status = await getBookingStatus(
    first.booking.reference,
    'GUEST@example.com',
  )
  assert.equal(status?.reference, first.booking.reference)
  assert.equal(
    await getBookingStatus(first.booking.reference, 'wrong@example.com'),
    null,
  )

  await assert.rejects(
    () =>
      createBooking({
        ...input,
        guestEmail: 'another@example.com',
      }),
    AvailabilityError,
  )

  const availability = await getAvailability({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: 3,
  })
  assert.equal(availability.available, false)
  assert.deepEqual(
    availability.unavailableDates,
    [futureDate(20), futureDate(21), futureDate(22)],
  )
})

test('stores an owner application without a WhatsApp handoff', async () => {
  const application = await createOwnerApplication({
    ownerName: 'Test Owner',
    email: 'owner@example.com',
    phone: '+20 100 000 0000',
    propertyName: 'Test Villa',
    location: 'Azha, Ain Sokhna',
    propertyType: 'villa',
    bedrooms: 3,
    maxGuests: 8,
    operationNotes:
      'Cleaning, maintenance, access and guest support are handled by a local operating team.',
  })
  assert.match(application.reference, /^OWNER-\d{8}-[A-F0-9]{6}$/)
  assert.equal(application.status, 'submitted')
})
