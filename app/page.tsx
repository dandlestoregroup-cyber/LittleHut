import Link from 'next/link'
import { ArrowRight, Check, LifeBuoy, MapPin, ShieldCheck } from 'lucide-react'
import { properties } from '@/lib/stayza/catalog'
import { formatEgp } from '@/lib/stayza/pricing'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function HomePage() {
  const featured = properties[0]

  return (
    <main>
      <SiteHeader />
      <section className="hero">
        <div className="hero-overlay" />
        <div className="site-shell hero-inner">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-light">Little Hut Vacations · Ain Sokhna</span>
            <h1>
              A few days that
              <span>feel like yours again.</span>
            </h1>
            <p>
              Search real dates, see the complete price, and place your stay
              request directly. Stayza keeps the booking record from the first
              click.
            </p>
          </div>
          <BookingSearch />
        </div>
      </section>

      <section className="trust-strip">
        <div className="site-shell trust-grid">
          <div><ShieldCheck /><span><b>Direct booking</b>No marketplace detour</span></div>
          <div><Check /><span><b>Real availability</b>Dates checked before quoting</span></div>
          <div><MapPin /><span><b>Local support</b>Ain Sokhna guest team</span></div>
          <div><LifeBuoy /><span><b>Stayza record</b>Your request is saved centrally</span></div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="site-shell split-heading">
          <div>
            <span className="eyebrow">The Little Hut edit</span>
            <h2>One real stay. No placeholder collection.</h2>
          </div>
          <p>
            We show only homes that are actually ready to be requested through
            the booking system. More Little Hut–sealed stays will appear here
            only after review.
          </p>
        </div>

        <article className="featured-stay site-shell">
          <img src={featured.heroImage} alt={featured.name} />
          <div className="featured-copy">
            <span className="eyebrow">Featured stay</span>
            <h3>{featured.name}</h3>
            <p className="location"><MapPin /> {featured.location}</p>
            <p>{featured.description}</p>
            <ul className="feature-list">
              {featured.features.slice(0, 4).map((feature) => (
                <li key={feature}><Check />{feature}</li>
              ))}
            </ul>
            <div className="rate-line">
              <span>From <b>{formatEgp(featured.minimumSuggestedRate)}</b> / night</span>
              <span>{featured.minimumNights}-night minimum</span>
            </div>
            <Link className="button button-primary" href={`/stays/${featured.slug}`}>
              See the stay <ArrowRight />
            </Link>
          </div>
        </article>
      </section>

      <section className="section experience-section">
        <div className="site-shell">
          <span className="eyebrow eyebrow-light">The Sokhna reset</span>
          <div className="experience-grid">
            <div>
              <span>01</span>
              <h3>Leave the week behind.</h3>
              <p>The road gets quieter, and so does everything else.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Arrive without admin.</h3>
              <p>Your dates and request are already recorded in Stayza.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Keep the good part.</h3>
              <p>We organise the stay, then give the space back to you.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-paper">
        <div className="site-shell owner-cta">
          <div>
            <span className="eyebrow">For owners</span>
            <h2>Have a home that belongs in Little Hut?</h2>
            <p>
              Submit it for review inside the system. No WhatsApp detour, and
              no automatic promise of the Little Hut seal.
            </p>
          </div>
          <Link className="button button-outline" href="/owners/apply">
            Submit your property <ArrowRight />
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
