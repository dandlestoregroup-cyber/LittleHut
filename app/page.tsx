'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'

const PHONE = '01270228656'
const WA = '201270228656'

type Enquiry = {
  reference: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  ages: string
  stayType: string
  name: string
  mobile: string
  notes: string
  createdAt: string
}

function makeRef(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export default function HomePage() {
  const [children, setChildren] = useState(0)
  const [error, setError] = useState('')
  const [ready, setReady] = useState<{ message: string; reference: string } | null>(null)
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    const draft = localStorage.getItem('lhv-enquiry-draft')
    if (!draft) return
    try {
      const value = JSON.parse(draft)
      setChildren(Number(value.children || 0))
      Object.entries(value).forEach(([key, val]) => {
        const field = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${key}"]`)
        if (field && typeof val === 'string') field.value = val
      })
    } catch {}
  }, [])

  function saveDraft(form: HTMLFormElement) {
    const data = Object.fromEntries(new FormData(form).entries())
    localStorage.setItem('lhv-enquiry-draft', JSON.stringify(data))
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    saveDraft(form)
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>
    if (data.checkIn < minDate) return setError('Check-in cannot be in the past.')
    if (!data.checkOut || data.checkOut <= data.checkIn) return setError('Check-out must be later than check-in.')
    if (Number(data.children) > 0 && !data.ages?.trim()) return setError("Please add the children's ages.")
    const enquiry: Enquiry = {
      reference: makeRef('LHV-E'),
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      adults: Number(data.adults),
      children: Number(data.children),
      ages: data.ages || '',
      stayType: data.stayType,
      name: data.name,
      mobile: data.mobile,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
    }
    const saved = JSON.parse(localStorage.getItem('lhv-enquiries') || '[]')
    saved.unshift(enquiry)
    localStorage.setItem('lhv-enquiries', JSON.stringify(saved))
    localStorage.removeItem('lhv-enquiry-draft')
    const message = [
      'Hello Little Hut Vacations, I would like to send an enquiry.',
      `Reference: ${enquiry.reference}`,
      `Check-in: ${enquiry.checkIn}`,
      `Check-out: ${enquiry.checkOut}`,
      `Adults: ${enquiry.adults}`,
      `Children: ${enquiry.children}`,
      enquiry.children ? `Children's ages: ${enquiry.ages}` : '',
      `Preferred stay: ${enquiry.stayType}`,
      `Guest name: ${enquiry.name}`,
      `Mobile: ${enquiry.mobile}`,
      enquiry.notes ? `Notes: ${enquiry.notes}` : '',
    ].filter(Boolean).join('\n')
    setReady({ message, reference: enquiry.reference })
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <main>
      <header className="site-nav">
        <a href="#top" className="brand"><span className="brand-mark">⌂</span><span>LITTLE HUT<small>VACATIONS</small></span></a>
        <button className="menu-button" aria-label="Open navigation" onClick={() => document.body.classList.toggle('nav-open')}>Menu</button>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#stays">Stays</a><a href="#feeling">The Feeling</a><a href="#ritual">Ain Sokhna</a><Link href="/list-your-property">For Owners</Link>
          <a href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">WhatsApp</a>
          <Link className="button small" href="/list-your-property">List Your Property</Link>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AIN SOKHNA IS YOUR PLAYGROUND</p>
          <h1>You forgot what this felt like.<em>Here it is again.</em></h1>
          <p className="lead">A few days in Ain Sokhna where nobody is managing the moment and ordinary things feel good again.</p>
          <div className="actions"><a className="button" href="#enquiry">Find your few days</a><a className="text-link" href="#feeling">See the feeling</a></div>
        </div>
        <div className="hero-photo" role="img" aria-label="Editorial Ain Sokhna mood photograph of a quiet sea-view terrace"><span>Editorial mood photography — not property inventory</span></div>
      </section>

      <section className="enquiry-section" id="enquiry">
        <div className="section-intro"><p className="eyebrow">DIRECT ENQUIRY BY LITTLE HUT VACATIONS</p><h2>Tell us when you want it back</h2><p>We save the details in this browser before opening WhatsApp. This is an enquiry, not a confirmed reservation.</p></div>
        <form className="enquiry-form" onSubmit={submit} onInput={(e) => saveDraft(e.currentTarget)}>
          <div className="two"><label>Check-in date*<input name="checkIn" type="date" min={minDate} required /></label><label>Check-out date*<input name="checkOut" type="date" min={minDate} required /></label></div>
          <div className="two"><label>Adults*<input name="adults" type="number" min="1" max="20" defaultValue="2" required /></label><label>Children*<input name="children" type="number" min="0" max="12" defaultValue="0" required onChange={(e) => setChildren(Number(e.target.value))} /></label></div>
          {children > 0 && <label>Children’s ages*<input name="ages" placeholder="For example: 4, 7" required /></label>}
          <label>Preferred stay type*<select name="stayType" required defaultValue=""><option value="" disabled>Select one</option><option>Family time</option><option>Couple escape</option><option>Quiet reset</option><option>Pool or lagoon access</option><option>Sea view</option><option>No preference</option></select></label>
          <div className="two"><label>Guest name*<input name="name" autoComplete="name" required /></label><label>Mobile number*<input name="mobile" type="tel" inputMode="tel" autoComplete="tel" required /></label></div>
          <label>Optional notes<textarea name="notes" rows={4} placeholder="Anything that would make the stay feel right?" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button full" type="submit">Prepare WhatsApp enquiry</button>
          <p className="form-note">Official WhatsApp: <strong>{PHONE}</strong></p>
        </form>
        {ready && <div className="success-panel" aria-live="polite"><h3>Your enquiry is ready to send.</h3><p>Reference: <strong>{ready.reference}</strong></p><div className="actions"><button className="button" onClick={() => navigator.clipboard.writeText(ready.message)}>Copy message</button><a className="button secondary" href={`https://wa.me/${WA}?text=${encodeURIComponent(ready.message)}`} target="_blank" rel="noreferrer">Retry WhatsApp</a><a className="text-link" href="#enquiry">Return to enquiry</a></div><p>Official number: {PHONE}</p></div>}
      </section>

      <section id="feeling" className="feeling-section"><div className="section-intro"><p className="eyebrow">THE FEELING</p><h2>Ordinary things, working again.</h2></div><div className="moment-grid">
        <article><div className="moment-photo coffee" /><h3>The coffee stayed warm.</h3><p>That was the first surprise.</p></article>
        <article><div className="moment-photo game" /><h3>They made up a game.</h3><p>You were not required to understand it.</p></article>
        <article><div className="moment-photo drinks" /><h3>The ice melted.</h3><p>The conversation did not.</p></article>
      </div><p className="photo-disclaimer">These are editorial mood images. They are not presented as photographs of available properties.</p></section>

      <section id="stays" className="stays-section"><div className="section-intro"><p className="eyebrow">REAL STAYS</p><h2>Homes for the feeling.</h2></div><div className="honest-panel"><h3>More Little Hut stays are being prepared.</h3><p>No property, amenity, rate or availability is shown publicly until it is verified. Tell us your dates and we will reply with the genuine options available.</p><a className="button" href="#enquiry">Send an enquiry</a></div></section>

      <section id="ritual"><div className="section-intro"><p className="eyebrow">THE SOKHNA RITUAL</p><h2>It starts before the sea appears.</h2></div><ol className="ritual-grid"><li><b>1. Leaving</b><p>The city gets quieter before the car does.</p></li><li><b>2. The air changes</b><p>You notice it before you see the sea.</p></li><li><b>3. First glimpse</b><p>There. That is the week getting smaller.</p></li><li><b>4. Arrival</b><p>Shoes off. Phones down. Nothing urgent.</p></li><li><b>5. You take it home</b><p>You left the keys. You kept the feeling.</p></li></ol></section>

      <section className="owner-cta"><div><p className="eyebrow">FOR OWNERS</p><h2>Have a home made for this feeling?</h2><p>Little Hut is building a focused collection, not an open marketplace. Tell us about your property and how it is operated.</p></div><div className="actions"><Link className="button" href="/list-your-property">Start property submission</Link><a className="text-link" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">Contact Little Hut on WhatsApp</a></div></section>

      <section className="final-cta"><h2>Ready to have it back?</h2><p>Your few days are closer than you think.</p><a className="button light" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">Book on WhatsApp · {PHONE}</a><small>Conversation only. Availability and confirmation follow separately.</small></section>
      <footer><span>Little Hut Vacations · Ain Sokhna</span><span>Direct enquiry by Little Hut Vacations</span><span>{PHONE}</span></footer>
    </main>
  )
}
