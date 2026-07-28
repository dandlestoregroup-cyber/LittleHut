import { notFound } from 'next/navigation'
import { BedDouble, Check, MapPin, ShowerHead, Users } from 'lucide-react'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getPropertyBySlug } from '@/lib/stayza/catalog'
import { formatEgp } from '@/lib/stayza/pricing'

export default async function StayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = getPropertyBySlug(slug)
  if (!property) notFound()

  return (
    <main className="page-background">
      <SiteHeader />
      <section className="stay-detail-hero">
        <img src={property.heroImage} alt={property.name} />
        <div className="stay-detail-overlay" />
        <div className="site-shell stay-detail-copy">
          <span className="eyebrow eyebrow-light">Little Hut sealed</span>
          <h1>{property.name}</h1>
          <p><MapPin />{property.location}</p>
        </div>
      </section>
      <section className="section section-paper">
        <div className="site-shell detail-layout">
          <div className="detail-main">
            <div className="stay-facts stay-facts-large">
              <span><Users /> Up to {property.maxGuests} guests</span>
              <span><BedDouble /> {property.bedrooms} bedrooms</span>
              <span><ShowerHead /> {property.bathrooms} bathrooms</span>
            </div>
            <h2>Space for the good part.</h2>
            <p className="lead-copy">{property.description}</p>
            <div className="feature-panel">
              <h3>What is included</h3>
              <ul className="feature-list feature-list-grid">
                {property.features.map((feature) => (
                  <li key={feature}><Check />{feature}</li>
                ))}
              </ul>
            </div>
            <div className="gallery-grid">
              {property.gallery.map((image, index) => (
                <img key={image} src={image} alt={`${property.name} view ${index + 1}`} />
              ))}
            </div>
          </div>
          <aside className="detail-booking-card">
            <span className="eyebrow">Direct rate</span>
            <div className="detail-rate">
              <b>{formatEgp(property.minimumSuggestedRate)}</b>
              <span>per night</span>
            </div>
            <p>
              Choose dates to receive the complete Stayza quote and real
              availability.
            </p>
            <BookingSearch propertySlug={property.slug} compact />
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
