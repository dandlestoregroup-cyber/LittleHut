'use client'

import { FormEvent, useState } from 'react'
import { CalendarDays, Clock3, ReceiptText, Search } from 'lucide-react'

interface BookingStatus {
  reference: string
  propertyName: string
  checkIn: string
  checkOut: string
  status: string
  paymentStatus: string
  total: number
  currency: string
  holdExpiresAt: string
}

function money(value: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function BookingTracker() {
  const [booking, setBooking] = useState<BookingStatus | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setBooking(null)
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/public/bookings/status', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reference: form.get('reference'),
          email: form.get('email'),
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Could not find this booking.')
      setBooking(body.booking)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not find this booking.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="site-shell tracker-layout">
      <form className="standalone-form" onSubmit={submit}>
        <h2>Find your booking</h2>
        <label>
          <span>Booking reference</span>
          <input
            name="reference"
            placeholder="LHV-YYYYMMDD-XXXXXX"
            autoCapitalize="characters"
            maxLength={40}
            required
          />
        </label>
        <label>
          <span>Booking email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-full" disabled={loading}>
          <Search />{loading ? 'Checking…' : 'Check status'}
        </button>
      </form>
      <div className="tracker-result">
        {!booking && (
          <div className="tracker-empty">
            <Clock3 />
            <h2>Your current status appears here.</h2>
            <p>We match both the reference and email before returning any booking detail.</p>
          </div>
        )}
        {booking && (
          <div className="status-card" aria-live="polite">
            <span className="status-pill">{booking.status}</span>
            <span className="eyebrow">{booking.reference}</span>
            <h2>{booking.propertyName}</h2>
            <div className="status-facts">
              <div><CalendarDays /><span><small>Dates</small><b>{booking.checkIn} → {booking.checkOut}</b></span></div>
              <div><ReceiptText /><span><small>Total</small><b>{money(booking.total)}</b></span></div>
              <div><Clock3 /><span><small>Payment</small><b>{booking.paymentStatus.replaceAll('_', ' ')}</b></span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
