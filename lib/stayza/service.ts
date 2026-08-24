import { createHash, randomBytes, randomUUID } from 'node:crypto'
import {
  getBookablePropertyById,
  getPropertyById,
  isPubliclyBookable,
  properties,
} from './catalog'
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

export class BookingGateError extends Error {
  constructor() {
    super('This home is not verified and open for booking through Little Hut.')
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
    (property) =>
      isPubliclyBookable(property) && input.guests <= property.maxGuests,
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
  const property = getBookablePropertyById(input.propertyId)
  if (!property) throw new BookingGateError()
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

/**
 * Owner-initiated date blocks reuse the exact same lock primitives that
 * guest bookings use (`acquireLock` / `readActiveLock`), so an owner block is
 * enforced by the identical authoritative availability check — there is no
 * separate "owner availability" data model to fall out of sync.
 */
export async function createOwnerBlock(input: {
  propertyId: string
  checkIn: string
  checkOut: string
  reason?: string
}) {
  const property = getPropertyById(input.propertyId)
  if (!property) throw new Error(`Unknown property ${input.propertyId}.`)

  const dates = stayDates(input.checkIn, input.checkOut)
  const blockId = `OWNER-BLOCK-${randomUUID()}`
  const now = new Date()
  const farFuture = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000)
  const acquired: string[] = []

  try {
    for (const date of dates) {
      const pathname = await acquireLock({
        bookingId: blockId,
        bookingReference: 'OWNER-BLOCK',
        propertyId: property.id,
        date,
        status: 'confirmed',
        expiresAt: farFuture.toISOString(),
        createdAt: now.toISOString(),
      })
      acquired.push(pathname)
    }
  } catch (error) {
    await Promise.all(acquired.map((pathname) => getRecordStore().delete(pathname)))
    if (error instanceof RecordConflictError) throw new AvailabilityError(dates)
    throw error
  }

  return { blockId, propertyId: property.id, dates, reason: input.reason }
}

export async function removeOwnerBlock(propertyId: string, dates: string[]) {
  await Promise.all(
    dates.map(async (date) => {
      const path = lockPath(propertyId, date)
      const record = await getRecordStore().getJson<AvailabilityLock>(path)
      // The lock path is shared with guest booking holds/confirmations, so
      // only release a lock this function actually created — never a
      // guest's booking lock that happens to occupy the same date.
      if (!record || record.value.bookingReference !== 'OWNER-BLOCK') return
      await getRecordStore().delete(path, record.etag)
    }),
  )
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Enumerates the nights of an existing booking WITHOUT the forward-dated
 * validation `stayDates` applies. Operator actions (confirming, declining,
 * cancelling) must work on bookings whose dates have already passed, which
 * the guest-facing validator deliberately rejects.
 */
function bookedNights(checkIn: string, checkOut: string): string[] {
  const start = new Date(`${checkIn}T00:00:00.000Z`).getTime()
  const end = new Date(`${checkOut}T00:00:00.000Z`).getTime()
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return []
  const nights = Math.round((end - start) / DAY_MS)
  return Array.from({ length: nights }, (_, index) =>
    new Date(start + index * DAY_MS).toISOString().slice(0, 10),
  )
}

/** Operator-only: every booking in the ledger, newest first. */
export async function listBookings(): Promise<BookingRecord[]> {
  const records = await getRecordStore().listJson<BookingRecord>(
    'stayza/bookings/by-reference/',
  )
  return records
    .map((record) => record.value)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Operator-only: every owner application, newest first. */
export async function listOwnerApplications(): Promise<OwnerApplication[]> {
  const records = await getRecordStore().listJson<OwnerApplication>(
    'stayza/owner-applications/',
  )
  return records
    .map((record) => record.value)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Owner self-service: an owner may look up their OWN application with the
 * reference plus the email they applied with. Mirrors the guest booking
 * lookup so owners are not left with no visibility after submitting.
 */
export async function getOwnerApplicationStatus(
  reference: string,
  email: string,
): Promise<OwnerApplication | null> {
  const record = await getRecordStore().getJson<OwnerApplication>(
    ownerApplicationPath(reference.toUpperCase()),
  )
  if (!record) return null
  // Compare case-insensitively on BOTH sides so applications stored before
  // emails were normalized on write remain reachable by their owner.
  if (
    record.value.email.trim().toLowerCase() !== email.trim().toLowerCase()
  ) {
    return null
  }
  return record.value
}

export async function setOwnerApplicationStatus(
  reference: string,
  status: OwnerApplication['status'],
): Promise<OwnerApplication> {
  const path = ownerApplicationPath(reference.toUpperCase())
  const record = await getRecordStore().getJson<OwnerApplication>(path)
  if (!record) throw new Error(`No owner application found for ${reference}.`)
  const updated: OwnerApplication = { ...record.value, status }
  await getRecordStore().putJson(path, updated, { overwrite: true })
  return updated
}

export async function getBookingForOperator(
  reference: string,
): Promise<BookingRecord | null> {
  const record = await getRecordStore().getJson<BookingRecord>(
    bookingPath(reference.toUpperCase()),
  )
  return record?.value ?? null
}

/**
 * The operator decision on a booking request. Confirming promotes every held
 * night to a confirmed lock (so the hold can no longer lapse); declining or
 * cancelling releases only the locks belonging to THIS booking, never a lock
 * another booking owns on the same night.
 */
export async function setBookingStatus(
  reference: string,
  status: BookingRecord['status'],
): Promise<BookingRecord> {
  const store = getRecordStore()
  const path = bookingPath(reference.toUpperCase())
  const record = await store.getJson<BookingRecord>(path)
  if (!record) throw new Error(`No booking found for ${reference}.`)

  const booking = record.value
  const nights = bookedNights(booking.checkIn, booking.checkOut)

  if (status === 'confirmed') {
    await Promise.all(
      nights.map(async (date) => {
        const lockPathname = lockPath(booking.propertyId, date)
        const lock = await store.getJson<AvailabilityLock>(lockPathname)
        if (!lock || lock.value.bookingId !== booking.id) return
        await store.putJson(
          lockPathname,
          {
            ...lock.value,
            status: 'confirmed',
            expiresAt: new Date(Date.now() + 100 * 365 * DAY_MS).toISOString(),
          },
          { overwrite: true },
        )
      }),
    )
  }

  if (status === 'declined' || status === 'cancelled' || status === 'expired') {
    await Promise.all(
      nights.map(async (date) => {
        const lockPathname = lockPath(booking.propertyId, date)
        const lock = await store.getJson<AvailabilityLock>(lockPathname)
        // Only release a lock this booking actually owns.
        if (!lock || lock.value.bookingId !== booking.id) return
        await store.delete(lockPathname, lock.etag)
      }),
    )
  }

  const updated: BookingRecord = {
    ...booking,
    status,
    updatedAt: new Date().toISOString(),
  }
  await store.putJson(path, updated, { overwrite: true })
  return updated
}

export async function createOwnerApplication(
  input: Omit<OwnerApplication, 'id' | 'reference' | 'status' | 'createdAt'>,
) {
  const reference = makeReference('OWNER')
  const record: OwnerApplication = {
    ...input,
    // Normalized on write, exactly as guest booking emails are, so the
    // owner's own status lookup matches regardless of how they typed it.
    email: input.email.trim().toLowerCase(),
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
