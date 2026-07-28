'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export function BookingSearch({
  propertySlug,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  compact = false,
}: {
  propertySlug?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  compact?: boolean
}) {
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? addDays(today, 1))
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? addDays(today, 3))
  const [guests, setGuests] = useState(initialGuests ?? 2)
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in.')
      return
    }
    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    })
    router.push(
      propertySlug
        ? `/book/${propertySlug}?${query.toString()}`
        : `/stays?${query.toString()}`,
    )
  }

  return (
    <form
      className={`booking-search ${compact ? 'booking-search-compact' : ''}`}
      id="search"
      onSubmit={submit}
    >
      {!compact && (
        <div className="search-heading">
          <span className="eyebrow">Search real availability</span>
          <h2>When do you want to disappear?</h2>
        </div>
      )}
      <div className="search-fields">
        <label>
          <span><CalendarDays /> Check-in</span>
          <input
            type="date"
            min={addDays(today, 0)}
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            required
          />
        </label>
        <label>
          <span><CalendarDays /> Check-out</span>
          <input
            type="date"
            min={checkIn || addDays(today, 1)}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            required
          />
        </label>
        <label>
          <span><Users /> Guests</span>
          <select
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary search-button" type="submit">
          {propertySlug ? 'Continue' : 'Check dates'} <ArrowRight />
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!compact && (
        <p className="search-note">
          Availability and price are checked inside Stayza. WhatsApp will not open.
        </p>
      )}
    </form>
  )
}
