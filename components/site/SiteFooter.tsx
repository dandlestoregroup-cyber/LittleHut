import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div>
          <Link className="brand brand-footer" href="/">
            <span className="brand-mark">⌂</span>
            <span>LITTLE HUT<small>VACATIONS</small></span>
          </Link>
          <p>Direct Ain Sokhna stays, powered by one Stayza booking record.</p>
        </div>
        <div>
          <b>Book</b>
          <Link href="/stays">Search stays</Link>
          <Link href="/track">Track a booking</Link>
        </div>
        <div>
          <b>Owners</b>
          <Link href="/owners/apply">Submit a property</Link>
        </div>
        <div>
          <b>Need human help?</b>
          <a href="tel:+201270228656">+20 127 022 8656</a>
          <a
            href="https://wa.me/201270228656?text=Hello%20Little%20Hut%20Vacations%2C%20I%20need%20support%20with%20an%20existing%20booking."
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp support
          </a>
          <small>Support only — booking stays on this website.</small>
        </div>
      </div>
      <div className="site-shell footer-bottom">
        <span>© {new Date().getFullYear()} Little Hut Vacations</span>
        <span>Booking technology by Stayza</span>
      </div>
    </footer>
  )
}
