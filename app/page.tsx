import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarCheck2,
  Check,
  FileCheck2,
  LifeBuoy,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { Localized } from '@/components/site/Localized'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { getMomentBySlug, moments } from '@/lib/moments'
import { isPubliclyBookable, properties } from '@/lib/stayza/catalog'
import { formatEgp } from '@/lib/stayza/pricing'

const journey = [
  { state: 'SEE', en: 'Discover', ar: 'اكتشف' },
  { state: 'SPARK', en: 'Choose a Moment', ar: 'اختر لحظة' },
  { state: 'SURE', en: 'Check the proof', ar: 'راجع الدليل' },
  { state: 'SECURE', en: 'Request clearly', ar: 'أرسل طلبك بوضوح' },
  { state: 'SHOW_UP', en: 'Arrive prepared', ar: 'صِل مستعداً' },
  { state: 'STAY', en: 'Stay supported', ar: 'إقامة بدعم' },
  { state: 'SHARE', en: 'Close the loop', ar: 'شارك تجربتك' },
]

export default function HomePage() {
  const verifiedHomes = properties.filter(isPubliclyBookable)
  const joiningHomes = properties.filter(
    (property) => property.active && !isPubliclyBookable(property),
  )

  return (
    <main>
      <SiteHeader />

      <section className="day-hero phase-dawn">
        <Image
          className="day-hero-image"
          src="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2000&q=90"
          alt="A quiet coast at the beginning of the day"
          fill
          priority
          sizes="100vw"
        />
        <div className="day-hero-overlay" />
        <div className="site-shell day-hero-grid">
          <div className="day-hero-copy">
            <span className="eyebrow">
              <Localized en="The Little Hut Day" ar="يوم ليتل هَت" />
            </span>
            <h1>
              <Localized
                en="What should this trip feel like?"
                ar="كيف تريد أن تشعر في هذه الرحلة؟"
              />
            </h1>
            <p>
              <Localized
                en="Begin with a Moment. Continue only with a home whose truth, availability and service promise can be shown clearly."
                ar="ابدأ بلحظة. ثم تابع فقط مع بيت يمكن إظهار حقيقته وتوافره ووعد خدمته بوضوح."
              />
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="#moments">
                <Localized en="Find your Moment" ar="ابحث عن لحظتك" />
                <ArrowRight aria-hidden="true" />
              </Link>
              <a className="text-link text-link-light" href="tel:+201270228656">
                <Localized en="Ask the Concierge" ar="اسأل فريق الضيافة" />
              </a>
            </div>
          </div>
          <BookingSearch />
        </div>
      </section>

      <section className="trust-strip" aria-label="Little Hut trust commitments">
        <div className="site-shell trust-grid">
          <div>
            <ShieldCheck />
            <span>
              <b><Localized en="Truth state first" ar="حالة الحقيقة أولاً" /></b>
              <Localized en="Verified or clearly Joining" ar="موثّق أو منضم بوضوح" />
            </span>
          </div>
          <div>
            <FileCheck2 />
            <span>
              <b><Localized en="Evidence before claims" ar="الدليل قبل الادعاء" /></b>
              <Localized en="No Seal without proof" ar="لا ختم بلا إثبات" />
            </span>
          </div>
          <div>
            <CalendarCheck2 />
            <span>
              <b><Localized en="Transparent request" ar="طلب حجز واضح" /></b>
              <Localized en="Availability, terms and total" ar="التوافر والشروط والإجمالي" />
            </span>
          </div>
          <div>
            <LifeBuoy />
            <span>
              <b><Localized en="One accountable record" ar="سجل واحد مسؤول" /></b>
              <Localized en="Stayza keeps the journey together" ar="Stayza يجمع الرحلة كاملة" />
            </span>
          </div>
        </div>
      </section>

      <section className="journey-strip" aria-label="The Little Hut guest journey">
        <ol className="site-shell journey-list">
          {journey.map((step) => (
            <li key={step.state}>
              <span>{step.state}</span>
              <Localized en={step.en} ar={step.ar} />
            </li>
          ))}
        </ol>
      </section>

      <section className="section moments-section" id="moments">
        <div className="site-shell section-heading-row">
          <div>
            <span className="eyebrow">
              <Localized en="A day made of Moments" ar="يوم تصنعه اللحظات" />
            </span>
            <h2>
              <Localized
                en="Start with the feeling, not the floor plan."
                ar="ابدأ بالشعور، لا بعدد الغرف."
              />
            </h2>
          </div>
          <p>
            <Localized
              en="Move from dawn to night. Each Moment becomes useful only when a home can prove it."
              ar="انتقل من الفجر إلى الليل. لا تصبح اللحظة مفيدة إلا عندما يستطيع البيت إثباتها."
            />
          </p>
        </div>

        <div className="moment-rail-wrap">
          <div className="site-shell moment-rail" role="list">
            {moments.map((moment) => (
              <Link
                className={`moment-card phase-${moment.phase}`}
                href={`/stays?moment=${moment.slug}`}
                key={moment.slug}
                role="listitem"
              >
                <Image
                  src={moment.image}
                  alt=""
                  fill
                  sizes="(max-width: 700px) 82vw, 360px"
                  style={{ objectPosition: moment.imagePosition ?? 'center' }}
                />
                <div className="moment-card-overlay" />
                <div className="moment-card-copy">
                  <span className="moment-phase">{moment.phase}</span>
                  <h3><Localized en={moment.title.en} ar={moment.title.ar} /></h3>
                  <p className="moment-phrase">
                    <Localized en={moment.phrase.en} ar={moment.phrase.ar} />
                  </p>
                  <p>
                    <Localized en={moment.context.en} ar={moment.context.ar} />
                  </p>
                  <span className="moment-action">
                    <Localized en="See homes for this Moment" ar="شاهد بيوت هذه اللحظة" />
                    <ArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section verified-section" id="homes">
        <div className="site-shell section-heading-row">
          <div>
            <span className="eyebrow">
              <Localized en="Verified homes" ar="البيوت الموثّقة" />
            </span>
            <h2>
              <Localized
                en="Bookable only when the proof is ready."
                ar="قابل للحجز فقط عندما يكتمل الدليل."
              />
            </h2>
          </div>
          <p>
            <Localized
              en="A verified card requires approved property media, a current Truth Card and evidence for every public Moment claim."
              ar="بطاقة البيت الموثّق تحتاج صوراً معتمدة وبطاقة حقيقة حديثة ودليلاً لكل لحظة معلنة."
            />
          </p>
        </div>

        {verifiedHomes.length === 0 ? (
          <div className="site-shell verified-empty">
            <div className="verified-empty-icon"><ShieldCheck /></div>
            <div>
              <span className="state-badge state-badge-neutral">
                <Localized en="Truthful inventory state" ar="حالة مخزون صادقة" />
              </span>
              <h3>
                <Localized
                  en="No home is being advertised as verified today."
                  ar="لا نعرض اليوم أي بيت على أنه موثّق."
                />
              </h3>
              <p>
                <Localized
                  en="That is intentional. Homes appear here only after verification, approved media and booking readiness are all complete."
                  ar="هذا مقصود. لا يظهر البيت هنا إلا بعد اكتمال التحقق واعتماد الصور والجاهزية للحجز."
                />
              </p>
            </div>
            <a className="button button-outline" href="tel:+201270228656">
              <Localized en="Ask the Concierge" ar="اسأل فريق الضيافة" />
            </a>
          </div>
        ) : (
          <div className="site-shell verified-home-grid">
            {verifiedHomes.map((home) => (
              <article className="verified-home-card" key={home.id}>
                <div className="truth-card-media">
                  <Image
                    src={home.heroImage}
                    alt={home.name}
                    fill
                    sizes="(max-width: 800px) 100vw, 50vw"
                  />
                  <span className="state-badge state-badge-verified">
                    <ShieldCheck /> Little Hut Verified Home
                  </span>
                </div>
                <div className="truth-card-copy">
                  <h3>{home.name}</h3>
                  <p className="location"><MapPin /><Localized en={home.location} ar={home.locationAr} /></p>
                  <p><Localized en={home.summary} ar={home.summaryAr} /></p>
                  <div className="moment-chip-row">
                    {home.momentMatches
                      .filter((match) => match.status === 'verified')
                      .slice(0, 3)
                      .map((match) => {
                        const moment = getMomentBySlug(match.moment)
                        return (
                          <span className="moment-chip" key={match.moment}>
                            {moment ? <Localized en={moment.title.en} ar={moment.title.ar} /> : match.moment}
                          </span>
                        )
                      })}
                  </div>
                  {home.honestLimitations[0] && (
                    <p className="honest-limit">
                      <b><Localized en="Good to know:" ar="من الجيد أن تعرف:" /></b>{' '}
                      <Localized en={home.honestLimitations[0]} ar={home.honestLimitationsAr[0]} />
                    </p>
                  )}
                  <div className="truth-card-footer">
                    <span>From <b>{formatEgp(home.minimumSuggestedRate)}</b></span>
                    <Link className="button button-primary" href={`/stays/${home.slug}`}>
                      <Localized en="View home" ar="شاهد البيت" /> <ArrowRight />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {joiningHomes.length > 0 && (
        <section className="section joining-section">
          <div className="site-shell section-heading-row compact-heading">
            <div>
              <span className="eyebrow">
                <Localized en="Joining Little Hut" ar="ينضم إلى ليتل هَت" />
              </span>
              <h2>
                <Localized
                  en="Potential Moments, clearly separated."
                  ar="لحظات محتملة، مفصولة بوضوح."
                />
              </h2>
            </div>
            <p>
              <Localized
                en="Public or source-provided signals may suggest a fit. These homes are not verified, priced or bookable."
                ar="قد تشير المعلومات العامة أو المقدّمة إلى ملاءمة محتملة. هذه البيوت غير موثّقة ولا مسعّرة ولا قابلة للحجز."
              />
            </p>
          </div>

          <div className="site-shell joining-grid">
            {joiningHomes.map((home) => (
              <article className="joining-card" key={home.id}>
                <div className="truth-card-media joining-media">
                  <Image
                    src={home.heroImage}
                    alt="Editorial coastal mood — not verified property evidence"
                    fill
                    sizes="(max-width: 800px) 100vw, 45vw"
                  />
                  <span className="media-note">
                    <Localized en="Editorial teaser · not property evidence" ar="صورة تعبيرية · ليست دليلاً على العقار" />
                  </span>
                </div>
                <div className="truth-card-copy">
                  <div className="state-row">
                    <span className="state-badge state-badge-joining">
                      <Localized en="Joining Little Hut" ar="ينضم إلى ليتل هَت" />
                    </span>
                    <span className="state-badge state-badge-potential">
                      <Sparkles /> <Localized en="Potential Moment" ar="لحظة محتملة" />
                    </span>
                  </div>
                  <h3>{home.name}</h3>
                  <p className="location"><MapPin /><Localized en={home.location} ar={home.locationAr} /></p>
                  <p><Localized en={home.sourceNote} ar={home.sourceNoteAr} /></p>
                  <div className="moment-chip-row">
                    {home.momentMatches.slice(0, 4).map((match) => {
                      const moment = getMomentBySlug(match.moment)
                      return (
                        <span className="moment-chip moment-chip-potential" key={match.moment}>
                          {moment ? <Localized en={moment.title.en} ar={moment.title.ar} /> : match.moment.replaceAll('-', ' ')}
                        </span>
                      )
                    })}
                  </div>
                  <p className="not-bookable-line">
                    <Localized
                      en="Not yet verified · Not bookable · No public price"
                      ar="غير موثّق بعد · غير قابل للحجز · بلا سعر معلن"
                    />
                  </p>
                  <Link className="button button-quiet" href={`/stays/${home.slug}`}>
                    <Localized en="Review the potential match" ar="راجع المطابقة المحتملة" />
                    <ArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section proof-section">
        <div className="site-shell section-heading-row">
          <div>
            <span className="eyebrow eyebrow-light">
              <Localized en="Trust you can inspect" ar="ثقة يمكنك فحصها" />
            </span>
            <h2>
              <Localized
                en="The promise lives in the product."
                ar="الوعد موجود داخل المنتج."
              />
            </h2>
          </div>
          <p>
            <Localized
              en="Stayza stays invisible, but its controls make every public claim and booking step accountable."
              ar="يبقى Stayza غير مرئي، لكن ضوابطه تجعل كل ادعاء وخطوة حجز قابلة للمساءلة."
            />
          </p>
        </div>
        <div className="site-shell proof-grid">
          <article>
            <span>01</span><FileCheck2 />
            <h3><Localized en="Evidence-backed truth" ar="حقيقة مدعومة بالدليل" /></h3>
            <p><Localized en="Verified means independently checked. Everything else stays visibly Joining." ar="موثّق تعني أنه تم فحصه بشكل مستقل. وما عدا ذلك يبقى منضماً بوضوح." /></p>
          </article>
          <article>
            <span>02</span><CalendarCheck2 />
            <h3><Localized en="Transparent booking" ar="حجز شفاف" /></h3>
            <p><Localized en="Real dates, an exact line-item quote and clear request status before payment." ar="تواريخ حقيقية وعرض سعر تفصيلي وحالة طلب واضحة قبل الدفع." /></p>
          </article>
          <article>
            <span>03</span><LifeBuoy />
            <h3><Localized en="Accountable service" ar="خدمة مسؤولة" /></h3>
            <p><Localized en="One reference keeps confirmation, payment state and the human support route together." ar="مرجع واحد يجمع التأكيد وحالة الدفع ومسار الدعم البشري." /></p>
          </article>
        </div>
      </section>

      <section className="night-moment">
        <Image
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1900&q=88"
          alt="Stars above a quiet landscape"
          fill
          sizes="100vw"
        />
        <div className="night-overlay" />
        <div className="site-shell night-copy">
          <span className="eyebrow eyebrow-light">
            <Localized en="The night state" ar="حالة الليل" />
          </span>
          <h2><Localized en="Stars and silence." ar="نجوم وسكون." /></h2>
          <p>
            <Localized
              en="Midnight belongs to evening and night Moments—not the whole platform."
              ar="لون منتصف الليل للحظات المساء والليل، لا للمنصة كلها."
            />
          </p>
          <Link className="button button-on-dark" href="/stays?moment=stars-and-silence">
            <Localized en="See this Moment" ar="شاهد هذه اللحظة" />
            <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="section section-paper">
        <div className="site-shell owner-cta">
          <div>
            <span className="eyebrow"><Localized en="For owners" ar="للمُلّاك" /></span>
            <h2>
              <Localized
                en="Does your home belong in Little Hut?"
                ar="هل ينتمي بيتك إلى ليتل هَت؟"
              />
            </h2>
            <p>
              <Localized
                en="Submit it for review. Joining is not a Seal, and acceptance is never automatic."
                ar="قدّمه للمراجعة. الانضمام ليس ختماً، والقبول ليس تلقائياً أبداً."
              />
            </p>
          </div>
          <Link className="button button-outline" href="/owners/apply">
            <Localized en="Submit your home" ar="قدّم بيتك" /> <ArrowRight />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
