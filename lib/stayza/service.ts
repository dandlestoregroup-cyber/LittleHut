import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { getPropertyById, properties } from './catalog'
import { buildQuote, stayDates } from './pricing'
import {
  getRecordStore,
  RecordConflictError,
  StorageNotConfiguredError,
} from './storage'
import type {
  AvailabilityLock,
  BookingRecord,
  BookingRequestInput,
  OwnerApplication,
} from './types'

const HOLD_HOURS = 12

export class AvailabilityError extends Error {
  constructor(public readonly unavailableDates: string[]) {
    super('One or more selected nights are no longer available.')
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('Too many requests. Please try again later.')
  }
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function safeSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-')
}

function bookingPath(reference: string) {
  return `stayza/bookings/by-reference/${safeSegment(reference)}.json`
}

function lockPath(propertyId: string, date: string) {
  return `stayza/locks/${safeSegment(propertyId)}/${date}.json`
}

function ownerApplicationPath(reference: string) {
  return `stayza/owner-applications/${safeSegment(reference)}.json`
}

function isActiveLock(lock: AvailabilityLock) {
  return lock.status === 'confirmed' || new Date(lock.expiresAt).getTime() > Date.now()
}

async function readActiveLock(propertyId: string, date: string) {
  const store = getRecordStore()
  const path = lockPath(propertyId, date)
  const record = await store.getJson<AvailabilityLock>(path)
  if (!record) return null
  if (isActiveLock(record.value)) return record
  await store.delete(path, record.etag)
  return null
}

export async function availablePropertyIds(input: {
  checkIn: string
  checkOut: string
  guests: number
}) {
  const dates = stayDates(input.checkIn, input.checkOut)
  const eligible = properties.filter(
    (property) => property.active && input.guests <= property.maxGuests,
  )
  const results = await Promise.all(
    eligible.map(async (property) => {
      const locks = await Promise.all(
        dates.map((date) => readActiveLock(property.id, date)),
      )
      return locks.some(Boolean) ? null : property.id
    }),
  )
  return results.filter((id): id is string => Boolean(id))
}

export async function getAvailability(input: {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
}) {
  const quote = buildQuote(input)
  const locks = await Promise.all(
    quote.nightly.map((night) => readActiveLock(input.propertyId, night.date)),
  )
  const unavailableDates = quote.nightly
    .filter((_, index) => Boolean(locks[index]))
    .map((night) => night.date)
  return { available: unavailableDates.length === 0, unavailableDates, quote }
}

async function acquireLock(lock: AvailabilityLock) {
  const store = getRecordStore()
  const path = lockPath(lock.propertyId, lock.date)
  const existing = await readActiveLock(lock.propertyId, lock.date)
  if (existing) throw new RecordConflictError(path)

  try {
    await store.putJson(path, lock)
  } catch (error) {
    if (error instanceof RecordConflictError) {
      const secondRead = await readActiveLock(lock.propertyId, lock.date)
      if (secondRead) throw error
      await store.putJson(path, lock)
      return path
    }
    throw error
  }
  return path
}

function makeReference(prefix: 'LHV' | 'OWNER') {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `${prefix}-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

export async function createBooking(input: BookingRequestInput) {
  const property = getPropertyById(input.propertyId)
  if (!property) throw new Error('Property not found.')
  if (input.adults + input.children > property.maxGuests) {
    throw new Error(
      `${property.name} accommodates up to ${property.maxGuests} guests.`,
    )
  }

  const quote = buildQuote({
    propertyId: input.propertyId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    guests: input.adults + input.children,
  })
  const bookingId = randomUUID()
  const reference = makeReference('LHV')
  const accessToken = randomBytes(24).toString('base64url')
  const now = new Date()
  const expires = new Date(now.getTime() + HOLD_HOURS * 60 * 60 * 1000)
  const acquired: string[] = []

  try {
    for (const date of stayDates(input.checkIn, input.checkOut)) {
      const pathname = await acquireLock({
        bookingId,
        bookingReference: reference,
        propertyId: property.id,
        date,
        status: 'held',
        expiresAt: expires.toISOString(),
        createdAt: now.toISOString(),
      })
      acquired.push(pathname)
    }
  } catch (error) {
    await Promise.all(acquired.map((pathname) => getRecordStore().delete(pathname)))
    if (error instanceof RecordConflictError) {
      throw new AvailabilityError(
        stayDates(input.checkIn, input.checkOut),
      )
    }
    throw error
  }

  const record: BookingRecord = {
    id: bookingId,
    reference,
    propertyId: property.id,
    propertyName: property.name,
    guestName: input.guestName.trim(),
    guestEmail: input.guestEmail.trim().toLowerCase(),
    guestPhone: input.guestPhone.trim(),
    adults: input.adults,
    children: input.children,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    specialRequests: input.specialRequests?.trim() || undefined,
    source: input.source ?? 'little_hut_direct',
    attribution: input.attribution ?? {},
    quote,
    status: 'requested',
    paymentStatus: 'not_requested',
    holdExpiresAt: expires.toISOString(),
    accessTokenHash: sha256(accessToken),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  try {
    await getRecordStore().putJson(bookingPath(reference), record)
  } catch (error) {
    await Promise.all(acquired.map((pathname) => getRecordStore().delete(pathname)))
    throw error
  }

  return { booking: record, accessToken }
}

export async function getBookingByAccess(
  reference: string,
  accessToken: string,
) {
  const record = await getRecordStore().getJson<BookingRecord>(
    bookingPath(reference.toUpperCase()),
  )
  if (!record || record.value.accessTokenHash !== sha256(accessToken)) return null
  return record.value
}

export async function getBookingStatus(reference: string, email: string) {
  const record = await getRecordStore().getJson<BookingRecord>(
    bookingPath(reference.toUpperCase()),
  )
  if (!record || record.value.guestEmail !== email.trim().toLowerCase()) return null
  const booking = record.value
  return {
    reference: booking.reference,
    propertyName: booking.propertyName,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    total: booking.quote.total,
    currency: booking.quote.currency,
    holdExpiresAt: booking.holdExpiresAt,
  }
}

export async function createOwnerApplication(
  input: Omit<OwnerApplication, 'id' | 'reference' | 'status' | 'createdAt'>,
) {
  const reference = makeReference('OWNER')
  const record: OwnerApplication = {
    ...input,
    id: randomUUID(),
    reference,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  }
  await getRecordStore().putJson(ownerApplicationPath(reference), record)
  return record
}

export async function enforceRateLimit(
  bucket: 'booking' | 'owner-application',
  identity: string,
  limit: number,
) {
  const store = getRecordStore()
  const day = new Date().toISOString().slice(0, 10)
  const identityHash = sha256(identity || 'unknown').slice(0, 24)
  const prefix = `stayza/rate-limit/${bucket}/${day}/${identityHash}/`
  const attempts = await store.listJson<{ createdAt: string }>(prefix)
  if (attempts.length >= limit) throw new RateLimitError()
  await store.putJson(
    `${prefix}${Date.now()}-${randomBytes(4).toString('hex')}.json`,
    { createdAt: new Date().toISOString() },
  )
}

export function storageHealth() {
  const store = getRecordStore()
  return {
    configured: store.kind !== 'unconfigured',
    kind: store.kind,
    productionReady: store.kind === 'vercel-blob',
  }
}

export { StorageNotConfiguredError }
