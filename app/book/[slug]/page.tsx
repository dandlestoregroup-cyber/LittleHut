import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { Localized } from '@/components/site/Localized'
import { BookingForm } from '@/components/booking/BookingForm'
import {
  getPropertyBySlug,
  isPubliclyBookable,
} from '@/lib/stayza/catalog'

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

  if (!isPubliclyBookable(property)) {
    return (
      <main className="page-background">
        <SiteHeader />
        <section className="section section-paper booking-gate-section">
          <div className="site-shell confirmation-card booking-gate-card">
            <div className="confirmation-icon"><ShieldCheck /></div>
            <span className="state-badge state-badge-joining">
              <Localized en="Joining Little Hut" ar="ينضم إلى ليتل هَت" />
            </span>
            <h1>
              <Localized
                en="This home is not open for booking."
                ar="هذا البيت غير مفتوح للحجز."
              />
            </h1>
            <p className="confirmation-lead">
              <Localized
                en="Little Hut has not completed the verification, approved-media and booking-readiness gates. No quote, hold or booking request has been created."
                ar="لم تُكمل ليتل هَت بوابات التحقق واعتماد الصور والجاهزية للحجز. لم يتم إنشاء عرض سعر أو حجز مؤقت أو طلب حجز."
              />
            </p>
            <Link className="button button-primary" href={`/stays/${property.slug}`}>
              <Localized en="Return to the truth state" ar="ارجع إلى حالة الحقيقة" />
              <ArrowRight />
            </Link>
          </div>
        </section>
        <SiteFooter />
      </main>
    )
  }

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
