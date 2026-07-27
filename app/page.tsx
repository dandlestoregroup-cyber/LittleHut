'use client'

import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'
import { Notice, SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { GuestEnquiry, OFFICIAL_PHONE, buildGuestMessage, makeReference, saveGuestEnquiry, whatsappUrl } from '@/lib/lhv-store'

type FormState = {
  checkIn: string
  checkOut: string
  adults: number
  children: number
  childrenAges: string
  stayType: string
  name: string
  mobile: string
  notes: string
}

const initial: FormState = {
  checkIn: '', checkOut: '', adults: 2, children: 0, childrenAges: '', stayType: 'No preference', name: '', mobile: '', notes: ''
}

export default function HomePage() {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState<{ message: string; reference: string } | null>(null)
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!form.checkIn) next.checkIn = 'Choose a check-in date.'
    if (!form.checkOut) next.checkOut = 'Choose a check-out date.'
    if (form.checkIn && form.checkIn < minDate) next.checkIn = 'Check-in cannot be in the past.'
    if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) next.checkOut = 'Check-out must be after check-in.'
    if (!form.name.trim()) next.name = 'Enter the guest name.'
    if (!form.mobile.trim()) next.mobile = 'Enter a mobile number.'
    if (form.children > 0 && !form.childrenAges.trim()) next.childrenAges = 'Add the children’s ages.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return
    const enquiry: GuestEnquiry = {
      ...form,
      reference: makeReference('LHV'),
      createdAt: new Date().toISOString(),
      status: 'Ready to send',
    }
    saveGuestEnquiry(enquiry)
    const message = buildGuestMessage(enquiry)
    setReady({ message, reference: enquiry.reference })
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
  }

  async function copyMessage() {
    if (!ready) return
    try { await navigator.clipboard.writeText(ready.message) } catch {
      const area = document.createElement('textarea')
      area.value = ready.message
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero" id="top">
          <div className="shell hero-grid">
            <div>
              <div className="eyebrow">Ain Sokhna is your playground</div>
              <h1>You forgot what this felt like.<span className="script">Here it is again.</span></h1>
              <p className="lead">A few days in Ain Sokhna where nobody is managing the moment and ordinary things feel good again.</p>
              <div className="action-row">
                <a className="button" href="#enquiry">Find your few days</a>
                <a className="button secondary" href="#feeling">See the feeling</a>
              </div>
            </div>

            <form className="enquiry-card" id="enquiry" onSubmit={submit} noValidate>
              <div className="eyebrow">Direct enquiry</div>
              <h2>Tell us when you want it back</h2>
              <p className="helper">Your enquiry is saved in this browser before WhatsApp opens. This is not a confirmed booking.</p>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="check-in">Check-in <span className="required">*</span></label>
                  <input id="check-in" type="date" min={minDate} value={form.checkIn} onChange={(e) => update('checkIn', e.target.value)} />
                  {errors.checkIn && <span className="error">{errors.checkIn}</span>}
                </div>
                <div className="field">
                  <label htmlFor="check-out">Check-out <span className="required">*</span></label>
                  <input id="check-out" type="date" min={form.checkIn || minDate} value={form.checkOut} onChange={(e) => update('checkOut', e.target.value)} />
                  {errors.checkOut && <span className="error">{errors.checkOut}</span>}
                </div>
                <div className="field">
                  <label htmlFor="adults">Adults <span className="required">*</span></label>
                  <select id="adults" value={form.adults} onChange={(e) => update('adults', Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8,9,10].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="children">Children</label>
                  <select id="children" value={form.children} onChange={(e) => update('children', Number(e.target.value))}>
                    {[0,1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                {form.children > 0 && <div className="field full">
                  <label htmlFor="children-ages">Children’s ages <span className="required">*</span></label>
                  <input id="children-ages" value={form.childrenAges} onChange={(e) => update('childrenAges', e.target.value)} placeholder="Example: 4, 7" />
                  {errors.childrenAges && <span className="error">{errors.childrenAges}</span>}
                </div>}
                <div className="field full">
                  <label htmlFor="stay-type">Preferred stay type</label>
                  <select id="stay-type" value={form.stayType} onChange={(e) => update('stayType', e.target.value)}>
                    {['Family time','Couple escape','Quiet reset','Pool or lagoon access','Sea view','No preference'].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="guest-name">Guest name <span className="required">*</span></label>
                  <input id="guest-name" autoComplete="name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className="field">
                  <label htmlFor="mobile">Mobile number <span className="required">*</span></label>
                  <input id="mobile" inputMode="tel" autoComplete="tel" value={form.mobile} onChange={(e) => update('mobile', e.target.value)} />
                  {errors.mobile && <span className="error">{errors.mobile}</span>}
                </div>
                <div className="field full">
                  <label htmlFor="notes">Optional notes</label>
                  <textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Anything that would help us understand the stay you want?" />
                </div>
              </div>
              <button className="button" type="submit">Prepare WhatsApp enquiry</button>
              <p className="helper">Official number: {OFFICIAL_PHONE}</p>
              {ready && <Notice tone="success">
                <b>Your enquiry is ready to send.</b>
                <p>Reference: {ready.reference}</p>
                <div className="action-row">
                  <button className="button secondary" type="button" onClick={copyMessage}>Copy message</button>
                  <a className="button" href={whatsappUrl(ready.message)} target="_blank" rel="noreferrer">Retry WhatsApp</a>
                  <a className="button ghost" href="#enquiry">Return to enquiry</a>
                </div>
              </Notice>}
            </form>
          </div>
        </section>

        <section className="section" id="feeling">
          <div className="shell">
            <div className="section-head"><div><div className="eyebrow">The feeling</div><h2>Ordinary things feel good again.</h2></div><p>These are mood moments, not property inventory. They show the kind of days Little Hut is trying to protect.</p></div>
            <div className="moments">
              <article className="moment"><img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80" alt="Coffee in warm morning light" loading="lazy" /><div className="moment-copy"><h3>The coffee stayed warm.</h3><span className="script">That was the first surprise.</span></div></article>
              <article className="moment"><img src="https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=900&q=80" alt="Children playing together outdoors" loading="lazy" /><div className="moment-copy"><h3>They made up a game.</h3><span className="script">You were not required to understand it.</span></div></article>
              <article className="moment"><img src="https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80" alt="Cold drinks during a long conversation" loading="lazy" /><div className="moment-copy"><h3>The ice melted.</h3><span className="script">The conversation did not.</span></div></article>
            </div>
          </div>
        </section>

        <section className="section alt" id="stays">
          <div className="shell">
            <div className="section-head"><div><div className="eyebrow">Real stays</div><h2>Homes for the feeling.</h2></div><p>Only source-supported property information appears here. Mood images elsewhere on this page are not presented as inventory.</p></div>
            <div className="stay-grid">
              <article className="stay-card">
                <img src="/Photoroom-20240618_102051.png" alt="Salty Life Villa reference image" onError={(e) => { e.currentTarget.src = '/IMG-20240502-WA0034 (2).png' }} />
                <div className="content"><div className="eyebrow">Verified Little Hut property</div><h3>Salty Life Villa</h3><p>Ain Sokhna. Full property facts, rates and availability are shared only after they are checked for the requested dates.</p><div className="fact-list"><span className="fact">Ain Sokhna</span><span className="fact">Enquiry-led availability</span></div><p className="truth-note">No nightly price, capacity, bed count, view or access claim is published here without verified source material.</p><Link className="button" href="/stays/salty-life-villa">View the property</Link></div>
              </article>
              <aside className="coming-card"><div className="eyebrow">Collection in preparation</div><h3>More Little Hut stays are being prepared.</h3><p>Tell us your dates and what you want from the stay. We will only suggest homes whose facts have been checked.</p><a className="button secondary" href="#enquiry">Tell us your dates</a></aside>
            </div>
          </div>
        </section>

        <section className="section" id="sokhna">
          <div className="shell"><div className="eyebrow">The Sokhna ritual</div><div className="ritual">
            <div className="ritual-step"><span>01</span><b>Leaving</b><p>The city gets quieter before the car does.</p></div>
            <div className="ritual-step"><span>02</span><b>The air changes</b><p>You notice it before you see the sea.</p></div>
            <div className="ritual-step"><span>03</span><b>First glimpse</b><p>There. That is the week getting smaller.</p></div>
            <div className="ritual-step"><span>04</span><b>Arrival</b><p>Shoes off. Phones down. Nothing urgent.</p></div>
            <div className="ritual-step"><span>05</span><b>You take it home</b><p>You left the keys. You kept the feeling.</p></div>
          </div></div>
        </section>

        <section className="section" id="owners"><div className="shell owner-cta"><div className="owner-copy"><div className="eyebrow">For owners</div><h2>Have a home made for this feeling?</h2><p>Little Hut is building a focused collection, not an open marketplace. Tell us about your property and how it is operated.</p></div><div className="action-row"><Link className="button" href="/list-your-property">Start property submission</Link><a className="button secondary" href={whatsappUrl('Hello Little Hut Vacations, I would like to discuss submitting a property.')} target="_blank" rel="noreferrer">Contact on WhatsApp</a></div></div></section>

        <section className="final-cta"><div className="shell final-row"><div><h2>Ready to have it back?</h2><p>Your few days are closer than you think.</p></div><a className="button" href={whatsappUrl('Hello Little Hut Vacations, I would like to enquire about a stay.')} target="_blank" rel="noreferrer">Book on WhatsApp · {OFFICIAL_PHONE}</a></div></section>
      </main>
      <SiteFooter />
    </>
  )
}
