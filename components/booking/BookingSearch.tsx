'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, Users } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

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
  selectedMoment,
  compact = false,
}: {
  propertySlug?: string
  initialCheckIn?: string
  initialCheckOut?: string
  initialGuests?: number
  selectedMoment?: string
  compact?: boolean
}) {
  const { language } = useLanguage()
  const router = useRouter()
  const today = useMemo(() => new Date(), [])
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? addDays(today, 1))
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? addDays(today, 3))
  const [guests, setGuests] = useState(initialGuests ?? 2)
  const [error, setError] = useState('')
  const copy = language === 'ar'
    ? {
        eyebrow: 'تحقق من البيوت الموثّقة',
        heading: 'متى تريد أن تبدأ لحظتك؟',
        checkIn: 'الوصول',
        checkOut: 'المغادرة',
        guests: 'الضيوف',
        guest: 'ضيف',
        guestsPlural: 'ضيوف',
        continue: 'متابعة',
        submit: 'تحقق من البيوت',
        note: 'نعرض الأسعار والتواريخ فقط للبيوت الموثّقة والمتاحة للحجز.',
        invalidDates: 'يجب أن يكون تاريخ المغادرة بعد تاريخ الوصول.',
      }
    : {
        eyebrow: 'Check verified homes',
        heading: 'When should your Moment begin?',
        checkIn: 'Check-in',
        checkOut: 'Check-out',
        guests: 'Guests',
        guest: 'guest',
        guestsPlural: 'guests',
        continue: 'Continue',
        submit: 'Check verified homes',
        note: 'Dates and prices appear only for verified, booking-enabled homes.',
        invalidDates: 'Check-out must be after check-in.',
      }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (checkOut <= checkIn) {
      setError(copy.invalidDates)
      return
    }
    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    })
    if (selectedMoment) query.set('moment', selectedMoment)
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
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2>{copy.heading}</h2>
        </div>
      )}
      <div className="search-fields">
        <label>
          <span><CalendarDays /> {copy.checkIn}</span>
          <input
            type="date"
            min={addDays(today, 0)}
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            required
          />
        </label>
        <label>
          <span><CalendarDays /> {copy.checkOut}</span>
          <input
            type="date"
            min={checkIn || addDays(today, 1)}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            required
          />
        </label>
        <label>
          <span><Users /> {copy.guests}</span>
          <select
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
          >
            {Array.from({ length: 8 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? copy.guest : copy.guestsPlural}
              </option>
            ))}
          </select>
        </label>
        <button className="button button-primary search-button" type="submit">
          {propertySlug ? copy.continue : copy.submit} <ArrowRight />
        </button>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      {!compact && (
        <p className="search-note">
          {copy.note}
        </p>
      )}
    </form>
  )
}
