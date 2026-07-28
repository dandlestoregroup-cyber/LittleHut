import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Home,
  ReceiptText,
} from 'lucide-react'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { formatEgp } from '@/lib/stayza/pricing'
import { getBookingByAccess } from '@/lib/stayza/service'

export const dynamic = 'force-dynamic'

export default async function BookingStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { reference } = await params
  const query = await searchParams
  const token = typeof query.token === 'string' ? query.token : ''
  if (!token) notFound()
  const booking = await getBookingByAccess(reference, token)
  if (!booking) notFound()

  const holdEnds = new Intl.DateTimeFormat('en-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo',
  }).format(new Date(booking.holdExpiresAt))

  return (
    <main className="page-background">
      <SiteHeader />
      <section className="section confirmation-section">
        <div className="site-shell confirmation-card">
          <div className="confirmation-icon"><CheckCircle2 /></div>
          <span className="eyebrow">Saved in Stayza</span>
          <h1>Your booking request is in.</h1>
          <p className="confirmation-lead">
            This is a real booking record—not a WhatsApp message. Keep the
            reference below to follow its confirmation and payment status.
          </p>
          <div className="reference-box">
            <span>Booking reference</span>
            <b>{booking.reference}</b>
          </div>
          <div className="confirmation-grid">
            <div><Home /><span><small>Stay</small><b>{booking.propertyName}</b></span></div>
            <div><CalendarDays /><span><small>Dates</small><b>{booking.checkIn} → {booking.checkOut}</b></span></div>
            <div><ReceiptText /><span><small>Total</small><b>{formatEgp(booking.quote.total)}</b></span></div>
            <div><Clock3 /><span><small>Current status</small><b>{booking.status}</b></span></div>
          </div>
          <div className="next-step-panel">
            <h2>What happens next</h2>
            <ol>
              <li><span>1</span><p><b>Dates held</b>Your selected nights are held until {holdEnds}.</p></li>
              <li><span>2</span><p><b>Review and payment</b>Little Hut confirms the next payment step against this reference.</p></li>
              <li><span>3</span><p><b>Confirmed in one record</b>Your status changes from requested to confirmed after the booking is approved.</p></li>
            </ol>
          </div>
          <div className="confirmation-actions">
            <Link className="button button-primary" href="/track">Track this booking later</Link>
            <Link className="button button-outline" href="/">Back to Little Hut</Link>
          </div>
          <p className="private-link-note">
            This page contains a private access token. Do not forward its URL.
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
