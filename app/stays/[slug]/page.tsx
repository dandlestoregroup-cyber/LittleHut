import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  BedDouble,
  Check,
  Eye,
  MapPin,
  ShieldCheck,
  ShowerHead,
  Sparkles,
  Users,
} from 'lucide-react'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { Localized } from '@/components/site/Localized'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getMomentBySlug } from '@/lib/moments'
import {
  getPropertyBySlug,
  isPubliclyBookable,
} from '@/lib/stayza/catalog'
import { formatEgp } from '@/lib/stayza/pricing'

export default async function StayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = getPropertyBySlug(slug)
  if (!property) notFound()

  const bookable = isPubliclyBookable(property)

  return (
    <main className="page-background">
      <SiteHeader />
      <section className={`stay-detail-hero ${bookable ? 'verified-detail' : 'joining-detail'}`}>
        <Image
          src={property.heroImage}
          alt={bookable ? property.name : ''}
          fill
          priority
          sizes="100vw"
        />
        <div className="stay-detail-overlay" />
        <div className="site-shell stay-detail-copy">
          <span className={`state-badge ${bookable ? 'state-badge-verified-detail' : 'state-badge-joining-detail'}`}>
            {bookable ? <ShieldCheck /> : <Sparkles />}
            <Localized
              en={bookable ? 'Little Hut Verified Home' : 'Joining Little Hut · Potential Moment'}
              ar={bookable ? 'بيت موثّق من ليتل هَت' : 'ينضم إلى ليتل هَت · لحظة محتملة'}
            />
          </span>
          <h1>{property.name}</h1>
          <p><MapPin /><Localized en={property.location} ar={property.locationAr} /></p>
        </div>
        {!bookable && (
          <span className="detail-media-note">
            <Localized
              en="Editorial mood image · not verified property evidence"
              ar="صورة تعبيرية · ليست دليلاً موثّقاً على العقار"
            />
          </span>
        )}
      </section>

      <section className="section section-paper">
        <div className="site-shell detail-layout">
          <div className="detail-main">
            {!bookable && (
              <div className="truth-notice truth-notice-joining">
                <Eye />
                <div>
                  <span className="eyebrow">
                    <Localized en="Truth state" ar="حالة الحقيقة" />
                  </span>
                  <h2>
                    <Localized
                      en="A candidate, not a product claim."
                      ar="بيت مرشّح، وليس ادعاءً جاهزاً للبيع."
                    />
                  </h2>
                  <p>
                    <Localized
                      en="The information below is source-reported. Little Hut has not completed its independent visit, approved public media or opened this home for booking."
                      ar="المعلومات أدناه مقدّمة من المصدر. لم تكمل ليتل هَت الزيارة المستقلة أو اعتماد الصور العامة أو فتح البيت للحجز."
                    />
                  </p>
                </div>
              </div>
            )}

            <div className={`stay-facts stay-facts-large ${bookable ? '' : 'source-reported-facts'}`}>
              {!bookable && (
                <b className="facts-label">
                  <Localized en="Source-reported signals" ar="بيانات مقدّمة من المصدر" />
                </b>
              )}
              <span><Users /> <Localized en={`Up to ${property.maxGuests} guests`} ar={`حتى ${property.maxGuests} ضيوف`} /></span>
              <span><BedDouble /> <Localized en={`${property.bedrooms} bedrooms`} ar={`${property.bedrooms} غرف نوم`} /></span>
              <span><ShowerHead /> <Localized en={`${property.bathrooms} bathrooms`} ar={`${property.bathrooms} حمامات`} /></span>
            </div>

            <h2>
              <Localized
                en={bookable ? 'Why this home belongs.' : 'Why it may belong.'}
                ar={bookable ? 'لماذا ينتمي هذا البيت.' : 'لماذا قد ينتمي هذا البيت.'}
              />
            </h2>
            <p className="lead-copy">
              <Localized
                en={bookable ? property.description : property.sourceNote}
                ar={bookable ? property.descriptionAr : property.sourceNoteAr}
              />
            </p>

            <div className={`feature-panel moment-proof-panel ${bookable ? '' : 'potential-proof-panel'}`}>
              <h3>
                <Localized
                  en={bookable ? 'Verified Moment proof' : 'Potential Moment signals'}
                  ar={bookable ? 'دليل اللحظات الموثّقة' : 'إشارات اللحظات المحتملة'}
                />
              </h3>
              <div className="moment-proof-list">
                {property.momentMatches.map((match) => {
                  const moment = getMomentBySlug(match.moment)
                  if (!moment) return null
                  return (
                    <article key={match.moment}>
                      <span className={`state-badge ${match.status === 'verified' ? 'state-badge-neutral' : 'state-badge-potential'}`}>
                        {match.status === 'verified' ? <Check /> : <Sparkles />}
                        <Localized
                          en={match.status === 'verified' ? 'Verified Moment' : 'Potential Moment'}
                          ar={match.status === 'verified' ? 'لحظة موثّقة' : 'لحظة محتملة'}
                        />
                      </span>
                      <h4><Localized en={moment.title.en} ar={moment.title.ar} /></h4>
                      <p><Localized en={match.reason} ar={match.reasonAr} /></p>
                      <small>
                        <Localized
                          en={match.evidenceSource === 'truth-card' ? 'Truth Card evidence' : 'Source-reported signal'}
                          ar={match.evidenceSource === 'truth-card' ? 'دليل بطاقة الحقيقة' : 'إشارة مقدّمة من المصدر'}
                        />
                      </small>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="feature-panel limitation-panel">
              <h3><Localized en="What to know" ar="ما يجب معرفته" /></h3>
              <ul className="feature-list">
                {property.honestLimitations.map((limitation, index) => (
                  <li key={limitation}>
                    <Eye />
                    <Localized
                      en={limitation}
                      ar={property.honestLimitationsAr[index] ?? limitation}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {bookable ? (
              <div className="gallery-grid">
                {property.gallery.map((image, index) => (
                  <div className="gallery-image" key={image}>
                    <Image
                      src={image}
                      alt={`${property.name} approved view ${index + 1}`}
                      fill
                      sizes={index === 0 ? '70vw' : '(max-width: 700px) 100vw, 35vw'}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="evidence-placeholder">
                <ShieldCheck />
                <div>
                  <h3><Localized en="Property evidence is not public yet." ar="دليل العقار غير منشور بعد." /></h3>
                  <p><Localized en="The gallery will appear only after approved photography is tied to a completed verification record." ar="لن يظهر المعرض إلا بعد ربط الصور المعتمدة بسجل تحقق مكتمل." /></p>
                </div>
              </div>
            )}
          </div>

          <aside className={`detail-booking-card ${bookable ? '' : 'joining-booking-gate'}`}>
            {bookable ? (
              <>
                <span className="eyebrow"><Localized en="Transparent rate" ar="سعر واضح" /></span>
                <div className="detail-rate">
                  <b>{formatEgp(property.minimumSuggestedRate)}</b>
                  <span><Localized en="per night" ar="لليلة" /></span>
                </div>
                <p>
                  <Localized
                    en="Choose dates to receive the complete Stayza quote and verified availability."
                    ar="اختر التواريخ للحصول على عرض Stayza الكامل والتوافر الموثّق."
                  />
                </p>
                <BookingSearch propertySlug={property.slug} compact />
              </>
            ) : (
              <>
                <span className="state-badge state-badge-joining">
                  <Localized en="Joining Little Hut" ar="ينضم إلى ليتل هَت" />
                </span>
                <h2>
                  <Localized
                    en="Not yet verified. Not bookable."
                    ar="غير موثّق بعد. غير قابل للحجز."
                  />
                </h2>
                <p>
                  <Localized
                    en="No dates, price or Request to Book action will appear until the verification and media gates pass."
                    ar="لن تظهر تواريخ أو أسعار أو طلب حجز حتى اجتياز بوابات التحقق واعتماد الصور."
                  />
                </p>
                <Link className="button button-quiet button-full" href="/#moments">
                  <Localized en="Find another Moment" ar="ابحث عن لحظة أخرى" />
                  <ArrowRight />
                </Link>
              </>
            )}
          </aside>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
