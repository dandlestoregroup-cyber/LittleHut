import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import {
  assertNoSecretFields,
  guestBookingView,
  operatorBookingView,
  ownerApplicationStatusView,
  publicPropertyView,
} from '../lib/stayza/access'
import { properties } from '../lib/stayza/catalog'
import {
  createSessionToken,
  verifyAccessKey,
  verifySessionToken,
} from '../lib/ops/session'
import type { BookingRecord, OwnerApplication } from '../lib/stayza/types'

const BOOKING: BookingRecord = {
  id: 'booking-1',
  reference: 'LHV-20260101-ABCDEF',
  propertyId: 'prop-salty-life-villa',
  propertyName: 'Salty Life Villa',
  guestName: 'Test Guest',
  guestEmail: 'guest@example.com',
  guestPhone: '+20 100 000 0000',
  adults: 2,
  children: 1,
  checkIn: '2026-09-01',
  checkOut: '2026-09-03',
  specialRequests: 'Late arrival',
  source: 'little_hut_direct',
  attribution: { utmSource: 'instagram', referrer: 'https://example.com' },
  quote: {
    propertyId: 'prop-salty-life-villa',
    checkIn: '2026-09-01',
    checkOut: '2026-09-03',
    guests: 3,
    nights: 2,
    nightly: [],
    accommodationTotal: 14000,
    feesTotal: 0,
    total: 14000,
    currency: 'EGP',
    minimumNights: 2,
  },
  status: 'requested',
  paymentStatus: 'not_requested',
  holdExpiresAt: '2026-08-25T00:00:00.000Z',
  accessTokenHash: 'THIS-MUST-NEVER-BE-SERIALIZED',
  createdAt: '2026-08-24T00:00:00.000Z',
  updatedAt: '2026-08-24T00:00:00.000Z',
}

const APPLICATION: OwnerApplication = {
  id: 'app-1',
  reference: 'OWNER-20260101-ABCDEF',
  ownerName: 'Test Owner',
  email: 'owner@example.com',
  phone: '+20 100 000 0000',
  propertyName: 'Test Villa',
  location: 'Azha, Ain Sokhna',
  propertyType: 'villa',
  bedrooms: 3,
  maxGuests: 8,
  operationNotes: 'Local operating team handles cleaning and access.',
  status: 'submitted',
  createdAt: '2026-08-24T00:00:00.000Z',
}

test('a guest booking view never leaks the access token hash or attribution', () => {
  const view = guestBookingView(BOOKING)
  assert.equal('accessTokenHash' in view, false)
  assert.equal('attribution' in view, false)
  assert.equal('guestEmail' in view, false)
  assert.equal('guestPhone' in view, false)
  assert.equal(view.reference, BOOKING.reference)
  assert.equal(view.total, 14000)
  assert.doesNotThrow(() => assertNoSecretFields(view, 'guest booking view'))
})

test('an operator booking view carries guest contact detail but still no token hash', () => {
  const view = operatorBookingView(BOOKING)
  assert.equal(view.guestEmail, 'guest@example.com')
  assert.equal(view.guestPhone, '+20 100 000 0000')
  assert.equal('accessTokenHash' in view, false)
  assert.doesNotThrow(() => assertNoSecretFields(view, 'operator booking view'))
})

test('the secret-field guard catches a leak nested anywhere in a payload', () => {
  assert.throws(
    () => assertNoSecretFields({ data: { list: [BOOKING] } }, 'raw booking'),
    /accessTokenHash/,
  )
})

test('an owner status view exposes only that owner’s own high-level state', () => {
  const view = ownerApplicationStatusView(APPLICATION)
  assert.deepEqual(Object.keys(view).sort(), [
    'createdAt',
    'propertyName',
    'reference',
    'status',
  ])
  assert.equal('email' in view, false)
  assert.equal('phone' in view, false)
  assert.equal('operationNotes' in view, false)
})

test('an unverified home never exposes capacity or price to the public', () => {
  properties[0].truthStatus = 'joining'
  properties[0].bookingEnabled = false
  properties[0].mediaStatus = 'editorial-teaser'

  const view = publicPropertyView(properties[0])
  assert.equal(view.bookingEnabled, false)
  assert.equal(view.maxGuests, undefined)
  assert.equal(view.fromRate, undefined)
  assert.equal(view.minimumNights, undefined)
  // Commercial internals are never public, in any state.
  assert.equal('baseNightlyRate' in view, false)
  assert.equal('ratePeriods' in view, false)
  assert.equal('minimumSuggestedRate' in view, false)
})

test('a verified home exposes the from-rate but still no rate periods', () => {
  properties[0].truthStatus = 'verified'
  properties[0].bookingEnabled = true
  properties[0].mediaStatus = 'approved-property'

  const view = publicPropertyView(properties[0])
  assert.equal(view.bookingEnabled, true)
  assert.equal(view.maxGuests, 8)
  assert.equal(view.fromRate, 7000)
  assert.equal('ratePeriods' in view, false)
  assert.equal('baseNightlyRate' in view, false)
})

// --- operator authentication ---

beforeEach(() => {
  process.env.OPS_ACCESS_KEY = 'test-operator-key'
  process.env.OPS_SESSION_SECRET = 'test-signing-secret'
})

afterEach(() => {
  delete process.env.OPS_ACCESS_KEY
  delete process.env.OPS_SESSION_SECRET
  properties[0].truthStatus = 'joining'
  properties[0].bookingEnabled = false
  properties[0].mediaStatus = 'editorial-teaser'
})

test('operator access requires the exact key and rejects everything else', () => {
  assert.equal(verifyAccessKey('test-operator-key'), true)
  assert.equal(verifyAccessKey('wrong-key'), false)
  assert.equal(verifyAccessKey(''), false)
  assert.equal(verifyAccessKey('test-operator-key-longer'), false)
})

test('a session token round-trips and a tampered one is rejected', () => {
  const token = createSessionToken('mo')
  const session = verifySessionToken(token)
  assert.equal(session?.actorId, 'mo')

  const [payload] = token.split('.')
  assert.equal(verifySessionToken(`${payload}.forged-signature`), null)
  assert.equal(verifySessionToken('nonsense'), null)
  assert.equal(verifySessionToken(undefined), null)
})

test('operator auth fails closed when no access key is configured', () => {
  const token = createSessionToken('mo')
  delete process.env.OPS_ACCESS_KEY
  delete process.env.OPS_SESSION_SECRET
  // With the deployment unconfigured, a previously valid token is refused
  // rather than treated as open access.
  assert.equal(verifySessionToken(token), null)
  assert.equal(verifyAccessKey('anything'), false)
})
