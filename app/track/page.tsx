import { BookingTracker } from '@/components/booking/BookingTracker'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function TrackPage() {
  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero">
        <div className="site-shell">
          <span className="eyebrow">Stayza booking record</span>
          <h1>Track your request.</h1>
          <p>
            Enter the same email used when booking. Your status is checked
            directly—no WhatsApp conversation required.
          </p>
        </div>
      </section>
      <section className="section section-paper">
        <BookingTracker />
      </section>
      <SiteFooter />
    </main>
  )
}
