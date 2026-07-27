'use client'

import Link from 'next/link'
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'

const PHONE = '01270228656'
const WA = '201270228656'
const STORAGE_KEY = 'lhv-owner-draft'
const SUBMISSIONS_KEY = 'lhv-owner-submissions'

const features = ['Sea view','Lagoon view','Pool view','Direct beach access','Pool access','Lagoon access','Private pool','Private garden','Wi-Fi','Air conditioning','Equipped kitchen','Washing machine','Parking','Children’s room','Baby cot','Pet friendly','Accessible entrance','Other']
const photoCategories = ['Exterior or entrance','Living area','Kitchen','Every bedroom','Every bathroom','Balcony, terrace or garden','View from the property','Pool, lagoon or beach access, only when applicable']

type Draft = Record<string, any>

function ref() { return `LHV-P-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}` }

export default function ListPropertyPage() {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>({ features: [], photos: {}, sameWhatsapp: true })
  const [error, setError] = useState('')
  const progress = `${(step / 6) * 100}%`

  useEffect(() => {
    try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) setDraft(JSON.parse(saved)) } catch {}
  }, [])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)) }, [draft])

  function set(name: string, value: any) { setDraft((d) => ({ ...d, [name]: value })) }
  function toggleFeature(value: string) { set('features', draft.features?.includes(value) ? draft.features.filter((x:string) => x !== value) : [...(draft.features || []), value]) }

  function validate() {
    const requiredByStep: Record<number, string[]> = {
      1: ['fullName','mobile','email','relationship','preferredContact'],
      2: ['compound','area','unitType','bedrooms','bathrooms','capacity'],
      3: ['guestLove'],
      4: [],
      5: ['preparation','guestSupport','accessMethod','advanceAccess','checkIn','checkOut'],
      6: ['minimumStay','availability'],
    }
    const missing = requiredByStep[step].find((k) => !String(draft[k] ?? '').trim())
    if (missing) { setError('Please complete the required fields before continuing.'); return false }
    setError(''); return true
  }

  function next() { if (validate()) setStep((s) => Math.min(6, s + 1)) }
  function back() { setError(''); setStep((s) => Math.max(1, s - 1)) }

  function handleFiles(category: string, e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const mapped = files.map((file) => ({ name: file.name, size: file.size, type: file.type, progress: 100 }))
    setDraft((d) => ({ ...d, photos: { ...(d.photos || {}), [category]: mapped } }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    if (!draft.declareAuth || !draft.declareAccurate || !draft.declareReview || !draft.declareVerify || !draft.declarePublish) return setError('Please accept all declarations before submitting.')
    const submission = { ...draft, reference: ref(), status: 'Submitted', submittedAt: new Date().toISOString(), history: [{ timestamp: new Date().toISOString(), reviewer: 'System', previousStatus: 'Draft', newStatus: 'Submitted', note: 'Owner submitted for review.' }] }
    const existing = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
    const duplicate = existing.find((x:any) => x.mobile === submission.mobile && x.compound === submission.compound && x.propertyName === submission.propertyName)
    if (duplicate) return setError(`A similar submission already exists: ${duplicate.reference}`)
    existing.unshift(submission)
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(existing))
    localStorage.setItem('lhv-last-submission', JSON.stringify(submission))
    localStorage.removeItem(STORAGE_KEY)
    window.location.href = '/owner-confirmation'
  }

  const title = useMemo(() => ['','First, who are we speaking with?','Tell us about the home','What makes the stay work?','Show us the home as it really is','Help us understand how stays are handled','Last step'][step], [step])

  return <main className="page-shell">
    <div className="page-head"><Link className="brand" href="/"><span className="brand-mark">⌂</span><span>LITTLE HUT<small>VACATIONS</small></span></Link><a className="text-link" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">WhatsApp · {PHONE}</a></div>
    <section className="section-intro"><p className="eyebrow">FOR OWNERS</p><h2>Have a home made for this feeling?</h2><p>Little Hut is building a focused collection of well-prepared holiday homes in Ain Sokhna. Tell us about your property and we’ll review whether it is the right fit.</p><p><strong>Takes approximately 7–10 minutes.</strong> You can save and continue later.</p><p className="muted">Submitting a property does not automatically publish it on Little Hut. Every home is reviewed before acceptance.</p></section>
    <form className="wizard" onSubmit={submit}>
      <div className="page-head"><div><span className="status-badge">{step} of 6</span><h1>{title}</h1></div><button type="button" className="text-link" onClick={() => localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))}>Save and continue later</button></div>
      <div className="progress"><span style={{width:progress}} /></div>

      {step === 1 && <div>
        <label>Full name*<input value={draft.fullName || ''} onChange={e=>set('fullName',e.target.value)} /></label>
        <div className="two"><label>Mobile number*<input type="tel" value={draft.mobile || ''} onChange={e=>set('mobile',e.target.value)} /></label><label>WhatsApp number<input type="tel" disabled={draft.sameWhatsapp} value={draft.sameWhatsapp ? draft.mobile || '' : draft.whatsapp || ''} onChange={e=>set('whatsapp',e.target.value)} /></label></div>
        <label className="check-row"><input type="checkbox" checked={draft.sameWhatsapp} onChange={e=>set('sameWhatsapp',e.target.checked)} />Same as mobile</label>
        <label>Email*<input type="email" value={draft.email || ''} onChange={e=>set('email',e.target.value)} /></label>
        <div className="two"><label>Relationship to property*<select value={draft.relationship || ''} onChange={e=>set('relationship',e.target.value)}><option value="">Select</option><option>Owner</option><option>Authorised family representative</option><option>Property manager</option><option>Other</option></select></label><label>Preferred contact*<select value={draft.preferredContact || ''} onChange={e=>set('preferredContact',e.target.value)}><option value="">Select</option><option>WhatsApp</option><option>Phone</option><option>Email</option></select></label></div>
      </div>}

      {step === 2 && <div>
        <label>Property name, if any<input value={draft.propertyName || ''} onChange={e=>set('propertyName',e.target.value)} /></label>
        <div className="two"><label>Compound or resort name*<input value={draft.compound || ''} onChange={e=>set('compound',e.target.value)} /></label><label>Ain Sokhna area*<input value={draft.area || ''} onChange={e=>set('area',e.target.value)} /></label></div>
        <label>Unit type*<select value={draft.unitType || ''} onChange={e=>set('unitType',e.target.value)}><option value="">Select</option>{['Chalet','Apartment','Villa','Townhouse','Twin house','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
        <div className="two"><label>Bedrooms*<input type="number" min="0" value={draft.bedrooms || ''} onChange={e=>set('bedrooms',e.target.value)} /></label><label>Bathrooms*<input type="number" min="0" value={draft.bathrooms || ''} onChange={e=>set('bathrooms',e.target.value)} /></label></div>
        <label>Maximum comfortable guest capacity*<input type="number" min="1" value={draft.capacity || ''} onChange={e=>set('capacity',e.target.value)} /></label>
        <div className="two"><label>Floor, when applicable<input value={draft.floor || ''} onChange={e=>set('floor',e.target.value)} /></label><label>Lift<select value={draft.lift || ''} onChange={e=>set('lift',e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Not applicable</option></select></label></div>
        <label>Outdoor space<select value={draft.outdoor || ''} onChange={e=>set('outdoor',e.target.value)}><option value="">Select</option>{['Balcony','Terrace','Garden','Roof','None'].map(x=><option key={x}>{x}</option>)}</select></label>
      </div>}

      {step === 3 && <div><div className="option-grid">{features.map(x=><label className="check-row" key={x}><input type="checkbox" checked={draft.features?.includes(x)} onChange={()=>toggleFeature(x)} />{x}</label>)}</div><label>What do guests usually love most about the home?*<textarea rows={4} value={draft.guestLove || ''} onChange={e=>set('guestLove',e.target.value)} /></label><label>Is anything shown in the photos shared, restricted or seasonal?<textarea rows={3} value={draft.restrictions || ''} onChange={e=>set('restrictions',e.target.value)} /></label><p className="muted">High-impact claims such as private pool, direct beach access, lagoon access, sea view, pet friendly, accessibility and capacity are flagged for verification before publication.</p></div>}

      {step === 4 && <div><p>Recent photos in clear daylight are preferred. No heavy filters. Do not show facilities guests cannot access. Professional photography is not required at submission stage.</p>{photoCategories.map(category=><label key={category}>{category}<input type="file" accept="image/*" multiple capture="environment" onChange={e=>handleFiles(category,e)} />{draft.photos?.[category]?.map((f:any)=><span key={f.name} className="muted">{f.name} · uploaded {f.progress}%<br/></span>)}</label>)}<div className="option-grid"><label className="check-row"><input type="radio" name="photoConfirm" checked={draft.photoConfirm==='current'} onChange={()=>set('photoConfirm','current')} />These are current photos</label><label className="check-row"><input type="radio" name="photoConfirm" checked={draft.photoConfirm==='later'} onChange={()=>set('photoConfirm','later')} />Professional photos will be available later</label></div></div>}

      {step === 5 && <div>
        <label>Who prepares the home?*<select value={draft.preparation || ''} onChange={e=>set('preparation',e.target.value)}><option value="">Select</option>{['My own team','Compound housekeeping','External cleaning team','Not arranged yet'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Who supports guests during the stay?*<select value={draft.guestSupport || ''} onChange={e=>set('guestSupport',e.target.value)}><option value="">Select</option>{['Owner','Family representative','Property manager','Local operator','Not arranged yet'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Key or access method*<select value={draft.accessMethod || ''} onChange={e=>set('accessMethod',e.target.value)}><option value="">Select</option>{['In person','Lockbox','Reception or security','Smart lock','Other'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Advance guest access*<select value={draft.advanceAccess || ''} onChange={e=>set('advanceAccess',e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Depends on compound</option></select></label>
        <div className="two"><label>Typical check-in time*<input type="time" value={draft.checkIn || ''} onChange={e=>set('checkIn',e.target.value)} /></label><label>Typical check-out time*<input type="time" value={draft.checkOut || ''} onChange={e=>set('checkOut',e.target.value)} /></label></div>
        <label>Current listing channels<input value={draft.channels || ''} onChange={e=>set('channels',e.target.value)} /></label><label>Optional listing link<input type="url" value={draft.listingLink || ''} onChange={e=>set('listingLink',e.target.value)} /></label><label>Operational information Little Hut should know<textarea rows={4} value={draft.operational || ''} onChange={e=>set('operational',e.target.value)} /></label>
      </div>}

      {step === 6 && <div>
        <div className="two"><label>Preferred nightly rate, optional<input type="number" min="0" value={draft.nightlyRate || ''} onChange={e=>set('nightlyRate',e.target.value)} /></label><label>Minimum stay*<input type="number" min="1" value={draft.minimumStay || ''} onChange={e=>set('minimumStay',e.target.value)} /></label></div>
        <div className="two"><label>Cleaning fee<input type="number" min="0" value={draft.cleaningFee || ''} onChange={e=>set('cleaningFee',e.target.value)} /></label><label>Security deposit<input type="number" min="0" value={draft.deposit || ''} onChange={e=>set('deposit',e.target.value)} /></label></div>
        <label>Availability*<select value={draft.availability || ''} onChange={e=>set('availability',e.target.value)}><option value="">Select</option><option>All year</option><option>Selected dates</option><option>Not confirmed yet</option></select></label><label>Approximate available dates, optional<input value={draft.availableDates || ''} onChange={e=>set('availableDates',e.target.value)} /></label>
        <label>Can Little Hut discuss pricing recommendations?<select value={draft.pricingAdvice || ''} onChange={e=>set('pricingAdvice',e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select></label>
        <h3>Owner declarations</h3>
        {[['declareAuth','I confirm I am authorised to submit this property.'],['declareAccurate','The information and photos are accurate to the best of my knowledge.'],['declareReview','I understand that submission does not guarantee acceptance or publication.'],['declareVerify','Little Hut may contact me to verify the property and operating arrangements.'],['declarePublish','No property information will be published without approval.']].map(([key,text])=><label className="check-row" key={key}><input type="checkbox" checked={!!draft[key]} onChange={e=>set(key,e.target.checked)} />{text}</label>)}
        <p className="muted">Owner contact details, documents, addresses, bank details and internal notes are private. Ownership documents are not requested at this initial stage.</p>
      </div>}

      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="wizard-actions"><button type="button" className="button secondary" onClick={back} disabled={step===1}>Previous</button>{step < 6 ? <button type="button" className="button" onClick={next}>Next</button> : <button type="submit" className="button">Submit for review</button>}</div>
    </form>
  </main>
}
