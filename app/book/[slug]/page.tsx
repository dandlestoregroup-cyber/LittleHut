import { notFound } from 'next/navigation'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { BookingForm } from '@/components/booking/BookingForm'
import { getPropertyBySlug } from '@/lib/stayza/catalog'

export default async function BookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const query = await searchParams
  const property = getPropertyBySlug(slug)
  if (!property) notFound()

  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero booking-page-hero">
        <div className="site-shell">
          <span className="eyebrow">Direct booking</span>
          <h1>Request {property.name}.</h1>
          <p>
            Your quote and request stay on this website and are recorded
            centrally in Stayza.
          </p>
        </div>
      </section>
      <BookingForm
        property={{
          id: property.id,
          slug: property.slug,
          name: property.name,
          location: property.location,
          heroImage: property.heroImage,
          maxGuests: property.maxGuests,
        }}
        initialCheckIn={typeof query.checkIn === 'string' ? query.checkIn : ''}
        initialCheckOut={typeof query.checkOut === 'string' ? query.checkOut : ''}
        initialGuests={
          typeof query.guests === 'string' ? Number(query.guests) : 2
        }
      />
      <SiteFooter />
    </main>
  )
}
