'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BedDouble, MapPin, Users } from 'lucide-react'
import { BookingSearch } from '@/components/booking/BookingSearch'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

interface SearchResult {
  property: {
    id: string
    slug: string
    name: string
    location: string
    summary: string
    maxGuests: number
    bedrooms: number
    bathrooms: number
    heroImage: string
    features: string[]
  }
  quote: {
    total: number
    currency: string
    nights: number
  }
}

function money(value: number) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(value)
}

function StaysContent() {
  const params = useSearchParams()
  const checkIn = params.get('checkIn') ?? ''
  const checkOut = params.get('checkOut') ?? ''
  const guests = Number(params.get('guests') ?? 2)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(Boolean(checkIn && checkOut))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!checkIn || !checkOut) return
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
        setResults(body.results)
      })
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [checkIn, checkOut, guests])

  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero">
        <div className="site-shell">
          <span className="eyebrow">Little Hut stays</span>
          <h1>{checkIn ? 'Your available few days.' : 'Find your few days.'}</h1>
          <p>
            Every result below is checked against the central Stayza booking
            ledger before we show it.
          </p>
          <BookingSearch
            compact
            initialCheckIn={checkIn || undefined}
            initialCheckOut={checkOut || undefined}
            initialGuests={guests}
          />
        </div>
      </section>

      <section className="section section-paper">
        <div className="site-shell">
          {loading && (
            <div className="system-state" aria-live="polite">
              <span className="spinner" />
              <h2>Checking Stayza availability…</h2>
              <p>Matching your dates and calculating the complete quote.</p>
            </div>
          )}
          {!loading && error && (
            <div className="system-state system-error" role="alert">
              <h2>We could not verify those dates.</h2>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && checkIn && results.length === 0 && (
            <div className="system-state">
              <h2>No Little Hut stay is free for those exact dates.</h2>
              <p>Try another date range above. We will never show a false match.</p>
            </div>
          )}
          {!loading && !error && !checkIn && (
            <div className="system-state">
              <h2>Choose your dates first.</h2>
              <p>The booking system needs dates and guest count before it can show a real price.</p>
            </div>
          )}
          {!loading && !error && results.length > 0 && (
            <>
              <div className="results-heading">
                <div>
                  <span className="eyebrow">Available now</span>
                  <h2>{results.length} verified {results.length === 1 ? 'stay' : 'stays'}</h2>
                </div>
                <p>{checkIn} → {checkOut} · {guests} guests</p>
              </div>
              <div className="results-grid">
                {results.map(({ property, quote }) => (
                  <article className="result-card" key={property.id}>
                    <img src={property.heroImage} alt={property.name} />
                    <div className="result-body">
                      <span className="eyebrow">Little Hut sealed</span>
                      <h3>{property.name}</h3>
                      <p className="location"><MapPin />{property.location}</p>
                      <p>{property.summary}</p>
                      <div className="stay-facts">
                        <span><Users /> Up to {property.maxGuests}</span>
                        <span><BedDouble /> {property.bedrooms} bedrooms</span>
                      </div>
                      <div className="result-price">
                        <span><b>{money(quote.total)}</b> total</span>
                        <small>{quote.nights} nights · complete accommodation price</small>
                      </div>
                      <Link
                        className="button button-primary"
                        href={`/book/${property.slug}?${new URLSearchParams({
                          checkIn,
                          checkOut,
                          guests: String(guests),
                        }).toString()}`}
                      >
                        Choose this stay <ArrowRight />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}

export default function StaysPage() {
  return (
    <Suspense
      fallback={
        <main className="page-background">
          <SiteHeader />
          <section className="section section-paper">
            <div className="system-state">
              <span className="spinner" />
              <h2>Opening the booking search…</h2>
            </div>
          </section>
          <SiteFooter />
        </main>
      }
    >
      <StaysContent />
    </Suspense>
  )
}
