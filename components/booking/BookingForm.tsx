'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Check, LockKeyhole, Users } from 'lucide-react'

interface Quote {
  propertyId: string
  checkIn: string
  checkOut: string
  guests: number
  nights: number
  accommodationTotal: number
  feesTotal: number
  total: number
  currency: string
  nightly: Array<{ date: string; rate: number; rateLabel: string }>
}

function money(value: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function BookingForm({
  property,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
}: {
  property: {
    id: string
    slug: string
    name: string
    location: string
    heroImage: string
    maxGuests: number
  }
  initialCheckIn: string
  initialCheckOut: string
  initialGuests: number
}) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [adults, setAdults] = useState(Math.max(1, initialGuests))
  const [children, setChildren] = useState(0)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [available, setAvailable] = useState(false)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setQuote(null)
      setAvailable(false)
      return
    }
    const controller = new AbortController()
    setQuoteLoading(true)
    setError('')
    fetch('/api/public/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        propertyId: property.id,
        checkIn,
        checkOut,
        guests: adults + children,
      }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not calculate quote.')
        setQuote(body.quote)
        setAvailable(body.available)
        if (!body.available) {
          setError('Those dates have just become unavailable. Please choose new dates.')
        }
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') {
          setQuote(null)
          setAvailable(false)
          setError(requestError.message)
        }
      })
      .finally(() => setQuoteLoading(false))

    return () => controller.abort()
  }, [property.id, checkIn, checkOut, adults, children])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quote || !available) return
    setSubmitting(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const params = new URLSearchParams(window.location.search)

    try {
      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          guestName: form.get('guestName'),
          guestEmail: form.get('guestEmail'),
          guestPhone: form.get('guestPhone'),
          adults,
          children,
          checkIn,
          checkOut,
          specialRequests: form.get('specialRequests'),
          consent: form.get('consent') === 'on',
          website: form.get('website'),
          attribution: {
            utmSource: params.get('utm_source') || undefined,
            utmMedium: params.get('utm_medium') || undefined,
            utmCampaign: params.get('utm_campaign') || undefined,
            referrer: document.referrer || undefined,
          },
        }),
      })
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body.error || 'Could not create the booking request.')
      }
      router.push(body.statusUrl)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not create the booking request.',
      )
      setSubmitting(false)
    }
  }

  return (
    <section className="section section-paper booking-form-section">
      <form className="site-shell booking-layout" onSubmit={submit}>
        <div className="booking-fields">
          <div className="form-section">
            <div className="form-section-heading">
              <span>1</span>
              <div><h2>Your stay</h2><p>Dates and guest count are checked live.</p></div>
            </div>
            <div className="form-grid">
              <label>
                <span>Check-in</span>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(event) => setCheckIn(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Check-out</span>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Adults</span>
                <select value={adults} onChange={(event) => setAdults(Number(event.target.value))}>
                  {Array.from({ length: property.maxGuests }, (_, index) => index + 1).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Children</span>
                <select value={children} onChange={(event) => setChildren(Number(event.target.value))}>
                  {Array.from(
                    { length: Math.max(1, property.maxGuests - adults + 1) },
                    (_, index) => index,
                  ).map((count) => (
                    <option key={count} value={count}>{count}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-heading">
              <span>2</span>
              <div><h2>Your details</h2><p>Used only to manage this request.</p></div>
            </div>
            <div className="form-grid">
              <label className="form-span-two">
                <span>Full name</span>
                <input name="guestName" autoComplete="name" maxLength={120} required />
              </label>
              <label>
                <span>Email</span>
                <input name="guestEmail" type="email" autoComplete="email" maxLength={200} required />
              </label>
              <label>
                <span>Mobile number</span>
                <input name="guestPhone" type="tel" autoComplete="tel" maxLength={30} required />
              </label>
              <label className="form-span-two">
                <span>Anything we should know? <small>Optional</small></span>
                <textarea name="specialRequests" rows={4} maxLength={1000} />
              </label>
              <label className="honeypot" aria-hidden="true">
                Website<input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
          </div>

          <label className="consent-row">
            <input name="consent" type="checkbox" required />
            <span>
              I confirm these details are correct and agree that Little Hut may
              contact me about this booking request.
            </span>
          </label>
        </div>

        <aside className="booking-summary">
          <img src={property.heroImage} alt={property.name} />
          <div className="summary-body">
            <span className="eyebrow">Your request</span>
            <h2>{property.name}</h2>
            <p>{property.location}</p>
            <div className="summary-facts">
              <span><CalendarDays />{checkIn || 'Choose dates'} → {checkOut || 'Choose dates'}</span>
              <span><Users />{adults + children} guests</span>
            </div>
            {quoteLoading && <p className="quote-state">Checking price and availability…</p>}
            {!quoteLoading && quote && (
              <div className="price-breakdown">
                <div>
                  <span>Accommodation · {quote.nights} nights</span>
                  <b>{money(quote.accommodationTotal)}</b>
                </div>
                <div>
                  <span>Booking fees</span>
                  <b>{money(quote.feesTotal)}</b>
                </div>
                <div className="price-total">
                  <span>Total</span>
                  <b>{money(quote.total)}</b>
                </div>
              </div>
            )}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button
              className="button button-primary button-full"
              type="submit"
              disabled={!quote || !available || quoteLoading || submitting}
            >
              {submitting ? 'Saving your request…' : 'Place booking request'}
            </button>
            <p className="secure-note">
              <LockKeyhole />
              This creates a Stayza reference and holds the dates for 12 hours.
              It does not open WhatsApp.
            </p>
            <p className="summary-status">
              <Check /> Request first · confirmation and payment status follow
              in the same booking record.
            </p>
          </div>
        </aside>
      </form>
    </section>
  )
}
