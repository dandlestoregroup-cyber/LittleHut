'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BedDouble,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { useLanguage } from '@/contexts/LanguageContext'
import { getMomentBySlug, type MomentSlug } from '@/lib/moments'

interface MomentMatch {
  moment: MomentSlug
  status: 'potential' | 'verified'
  reason: string
  reasonAr: string
  evidenceSource: 'source-reported' | 'truth-card'
}

interface PublicHome {
  id: string
  slug: string
  name: string
  location: string
  locationAr: string
  summary: string
  summaryAr: string
  heroImage: string
  truthStatus: 'joining' | 'verified'
  bookingEnabled: boolean
  mediaStatus: 'editorial-teaser' | 'approved-property'
  sourceNote: string
  sourceNoteAr: string
  honestLimitations: string[]
  honestLimitationsAr: string[]
  momentMatches: MomentMatch[]
}

interface SearchResult {
  property: {
    id: string
    slug: string
    name: string
    location: string
    locationAr: string
    summary: string
    summaryAr: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    heroImage: string
    features: string[]
    truthStatus: 'verified'
    mediaStatus: 'approved-property'
    momentMatches: MomentMatch[]
    honestLimitations: string[]
    honestLimitationsAr: string[]
  }
  quote: {
    total: number
    currency: string
    nights: number
  }
}

function money(value: number, language: 'en' | 'ar') {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

export function StaysExplorer({
  homes,
  search,
}: {
  homes: PublicHome[]
  search: {
    checkIn: string
    checkOut: string
    guests: number
    moment: string
  }
}) {
  const { language } = useLanguage()
  const { checkIn, checkOut, guests, moment: momentSlug } = search
  const selectedMoment = getMomentBySlug(momentSlug)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(Boolean(checkIn && checkOut))
  const [error, setError] = useState('')

  const copy = language === 'ar'
    ? {
        eyebrow: 'اكتشف بصدق',
        titleMoment: 'بيوت قد تصنع هذه اللحظة.',
        titleDates: 'البيوت الموثّقة المتاحة.',
        titleDefault: 'ابحث عن لحظتك.',
        intro: 'تظهر النتائج الموثّقة أولاً. وتبقى البيوت المنضمة في قسم منفصل بلا سعر أو حجز.',
        checking: 'يتحقق Stayza من البيوت الموثّقة…',
        checkingNote: 'مطابقة التواريخ وحساب عرض السعر الكامل.',
        errorTitle: 'تعذر التحقق من هذه التواريخ.',
        verifiedFor: 'موثّق لهذه اللحظة',
        availableNow: 'متاح الآن',
        noVerified: 'لا يوجد بيت موثّق يطابق هذا الطلب حالياً.',
        noVerifiedNote: 'لن نرفع بيتاً من «منضم» إلى «موثّق» لمجرد ملء النتائج.',
        chooseFirst: 'اختر لحظة أو تواريخ للبدء.',
        chooseFirstNote: 'يمكنك الاستكشاف بالشعور أولاً، أو التحقق من التوافر الحقيقي بالتواريخ.',
        joining: 'ينضم إلى ليتل هَت',
        joiningIntro: 'إشارات محتملة فقط. هذه البيوت غير موثّقة وغير قابلة للحجز.',
        potential: 'لحظة محتملة',
        editorial: 'صورة تعبيرية · ليست دليلاً على العقار',
        notBookable: 'غير موثّق بعد · غير قابل للحجز · بلا سعر معلن',
        why: 'لماذا قد يطابق؟',
        review: 'راجع المطابقة المحتملة',
        guests: 'حتى',
        bedrooms: 'غرف نوم',
        total: 'الإجمالي',
        nights: 'ليالٍ · سعر إقامة كامل',
        choose: 'اختر هذا البيت',
      }
    : {
        eyebrow: 'Truthful discovery',
        titleMoment: 'Homes that may hold this Moment.',
        titleDates: 'Verified homes for your dates.',
        titleDefault: 'Find your Moment.',
        intro: 'Verified results appear first. Joining homes stay in a separate section with no price or booking action.',
        checking: 'Stayza is checking verified homes…',
        checkingNote: 'Matching dates and calculating a complete quote.',
        errorTitle: 'We could not verify those dates.',
        verifiedFor: 'Verified for this Moment',
        availableNow: 'Available now',
        noVerified: 'No verified home matches this request yet.',
        noVerifiedNote: 'We will not promote a Joining home merely to fill the results.',
        chooseFirst: 'Choose a Moment or dates to begin.',
        chooseFirstNote: 'Discover by feeling first, or use dates to check real verified availability.',
        joining: 'Joining Little Hut',
        joiningIntro: 'Potential signals only. These homes are not verified or bookable.',
        potential: 'Potential Moment',
        editorial: 'Editorial teaser · not property evidence',
        notBookable: 'Not yet verified · Not bookable · No public price',
        why: 'Why it may match',
        review: 'Review the potential match',
        guests: 'Up to',
        bedrooms: 'bedrooms',
        total: 'total',
        nights: 'nights · complete accommodation price',
        choose: 'Choose this home',
      }

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setLoading(false)
      setResults([])
      return
    }

    const controller = new AbortController()
    const query = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(guests),
    })
    setLoading(true)
    setError('')
    fetch(`/api/public/search?${query.toString()}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not check dates.')
        const verifiedResults = (body.results as SearchResult[]).filter(
          ({ property }) =>
            property.truthStatus === 'verified' &&
            property.mediaStatus === 'approved-property' &&
            (!selectedMoment ||
              property.momentMatches.some(
                (match) =>
                  match.moment === selectedMoment.slug &&
                  match.status === 'verified',
              )),
        )
        setResults(verifiedResults)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [checkIn, checkOut, guests, selectedMoment])

  const joiningHomes = useMemo(
    () =>
      homes.filter(
        (home) =>
          home.truthStatus === 'joining' &&
          (!selectedMoment ||
            home.momentMatches.some(
              (match) => match.moment === selectedMoment.slug,
            )),
      ),
    [homes, selectedMoment],
  )

  const title = selectedMoment
    ? copy.titleMoment
    : checkIn
      ? copy.titleDates
      : copy.titleDefault

  return (
    <>
      <section className="page-hero discovery-hero">
        <div className="site-shell">
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{title}</h1>
          <p>{copy.intro}</p>
          {selectedMoment && (
            <div className="selected-moment">
              <Sparkles />
              <div>
                <span>{selectedMoment.title[language]}</span>
                <b>{selectedMoment.phrase[language]}</b>
              </div>
            </div>
          )}
          <BookingSearch
            compact
            selectedMoment={selectedMoment?.slug}
            initialCheckIn={checkIn || undefined}
            initialCheckOut={checkOut || undefined}
            initialGuests={guests}
          />
        </div>
      </section>

      <section className="section section-paper discovery-results">
        <div className="site-shell">
          {loading && (
            <div className="system-state" aria-live="polite">
              <span className="spinner" />
              <h2>{copy.checking}</h2>
              <p>{copy.checkingNote}</p>
            </div>
          )}
          {!loading && error && (
            <div className="system-state system-error" role="alert">
              <h2>{copy.errorTitle}</h2>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && (checkIn || selectedMoment) && results.length === 0 && (
            <div className="verified-results-empty">
              <ShieldCheck />
              <div>
                <span className="eyebrow">{selectedMoment ? copy.verifiedFor : copy.availableNow}</span>
                <h2>{copy.noVerified}</h2>
                <p>{copy.noVerifiedNote}</p>
              </div>
            </div>
          )}
          {!loading && !error && !checkIn && !selectedMoment && (
            <div className="system-state">
              <Sparkles />
              <h2>{copy.chooseFirst}</h2>
              <p>{copy.chooseFirstNote}</p>
            </div>
          )}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-heading">
                <div>
                  <span className="eyebrow">{selectedMoment ? copy.verifiedFor : copy.availableNow}</span>
                  <h2>{results.length} {language === 'ar' ? 'بيت موثّق' : results.length === 1 ? 'verified home' : 'verified homes'}</h2>
                </div>
                <p>{checkIn} → {checkOut} · {guests}</p>
              </div>
              <div className="results-grid">
                {results.map(({ property, quote }) => {
                  const why = selectedMoment
                    ? property.momentMatches.find(
                        (match) => match.moment === selectedMoment.slug,
                      )
                    : property.momentMatches.find(
                        (match) => match.status === 'verified',
                      )
                  return (
                    <article className="result-card result-card-verified" key={property.id}>
                      <div className="result-card-media">
                        <Image
                          src={property.heroImage}
                          alt={property.name}
                          fill
                          sizes="(max-width: 700px) 100vw, 45vw"
                        />
                        <span className="state-badge state-badge-verified">
                          <ShieldCheck /> Little Hut Verified Home
                        </span>
                      </div>
                      <div className="result-body">
                        <h3>{property.name}</h3>
                        <p className="location"><MapPin />{language === 'ar' ? property.locationAr : property.location}</p>
                        <p>{language === 'ar' ? property.summaryAr : property.summary}</p>
                        {why && (
                          <div className="why-match">
                            <b>{copy.why}</b>
                            <span>{language === 'ar' ? why.reasonAr : why.reason}</span>
                          </div>
                        )}
                        <div className="stay-facts">
                          <span><Users /> {copy.guests} {property.maxGuests}</span>
                          <span><BedDouble /> {property.bedrooms} {copy.bedrooms}</span>
                        </div>
                        <div className="result-price">
                          <span><b>{money(quote.total, language)}</b> {copy.total}</span>
                          <small>{quote.nights} {copy.nights}</small>
                        </div>
                        <Link
                          className="button button-primary"
                          href={`/book/${property.slug}?${new URLSearchParams({
                            checkIn,
                            checkOut,
                            guests: String(guests),
                          }).toString()}`}
                        >
                          {copy.choose} <ArrowRight />
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {joiningHomes.length > 0 && (
        <section className="section joining-section discovery-joining">
          <div className="site-shell results-heading joining-results-heading">
            <div>
              <span className="eyebrow">{copy.joining}</span>
              <h2>{selectedMoment ? copy.potential : copy.joining}</h2>
            </div>
            <p>{copy.joiningIntro}</p>
          </div>
          <div className="site-shell joining-grid">
            {joiningHomes.map((home) => {
              const why = selectedMoment
                ? home.momentMatches.find(
                    (match) => match.moment === selectedMoment.slug,
                  )
                : home.momentMatches[0]
              return (
                <article className="joining-card" key={home.id}>
                  <div className="truth-card-media joining-media">
                    <Image
                      src={home.heroImage}
                      alt=""
                      fill
                      sizes="(max-width: 800px) 100vw, 45vw"
                    />
                    <span className="media-note">{copy.editorial}</span>
                  </div>
                  <div className="truth-card-copy">
                    <div className="state-row">
                      <span className="state-badge state-badge-joining">{copy.joining}</span>
                      <span className="state-badge state-badge-potential"><Sparkles />{copy.potential}</span>
                    </div>
                    <h3>{home.name}</h3>
                    <p className="location"><MapPin />{language === 'ar' ? home.locationAr : home.location}</p>
                    <p>{language === 'ar' ? home.sourceNoteAr : home.sourceNote}</p>
                    {why && (
                      <div className="why-match why-match-potential">
                        <b>{copy.why}</b>
                        <span>{language === 'ar' ? why.reasonAr : why.reason}</span>
                      </div>
                    )}
                    <p className="not-bookable-line">{copy.notBookable}</p>
                    <Link className="button button-quiet" href={`/stays/${home.slug}`}>
                      {copy.review} <ArrowRight />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
