'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Notice, SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { OwnerSubmission, clearOwnerDraft, loadOwnerDraft, makeReference, saveOwnerDraft, saveOwnerSubmission } from '@/lib/lhv-store'

const steps = ['About you','About the property','What the guest receives','Photos','How the property operates','Commercial details']
const defaultSubmission: OwnerSubmission = {
  reference: '', createdAt: '', updatedAt: '', status: 'Draft', step: 1,
  owner: { fullName:'', mobile:'', whatsapp:'', sameAsMobile:true, email:'', relationship:'Owner', preferredContact:'WhatsApp' },
  property: { propertyName:'', compound:'', area:'', unitType:'Chalet', bedrooms:1, bathrooms:1, capacity:2, floor:'', lift:'Not applicable', outdoorSpace:'Balcony' },
  features: [], guestLove:'', restrictions:'', photos: [],
  operations: { preparation:'My own team', support:'Owner', accessMethod:'In person', advanceAccess:'Depends on compound', checkIn:'', checkOut:'', channels:'', listingLink:'', notes:'' },
  commercial: { nightlyRate:'', minimumStay:'', cleaningFee:'', securityDeposit:'', availability:'Not confirmed yet', approximateDates:'', pricingAdvice:'Yes' },
  declarations: { authorised:false, accurate:false, noGuarantee:false, verification:false, noPublication:false }, history: []
}

const featureOptions = ['Sea view','Lagoon view','Pool view','Direct beach access','Pool access','Lagoon access','Private pool','Private garden','Wi-Fi','Air conditioning','Equipped kitchen','Washing machine','Parking','Children’s room','Baby cot','Pet friendly','Accessible entrance','Other']
const highImpact = ['Private pool','Direct beach access','Lagoon access','Sea view','Pet friendly','Accessible entrance']
const photoCategories = ['Exterior or entrance','Living area','Kitchen','Every bedroom','Every bathroom','Balcony, terrace or garden','View from the property','Pool, lagoon or beach access, only when applicable']

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const max = 1200
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas unavailable'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', .72))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function ListYourPropertyPage() {
  const router = useRouter()
  const [submission, setSubmission] = useState<OwnerSubmission>(defaultSubmission)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [uploadProgress, setUploadProgress] = useState(0)
  const [category, setCategory] = useState(photoCategories[0])
  const [draftLoaded, setDraftLoaded] = useState(false)

  useEffect(() => {
    const draft = loadOwnerDraft()
    if (draft) setSubmission(draft)
    setDraftLoaded(true)
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    const timer = setTimeout(() => saveOwnerDraft({ ...submission, updatedAt: new Date().toISOString() }), 350)
    return () => clearTimeout(timer)
  }, [submission, draftLoaded])

  const step = submission.step
  const percent = useMemo(() => Math.round((step / 6) * 100), [step])

  function updateGroup(group: 'owner'|'property'|'operations'|'commercial'|'declarations', key: string, value: string|number|boolean) {
    setSubmission((current) => ({ ...current, [group]: { ...current[group], [key]: value } }))
    setErrors((current) => ({ ...current, [key]: '' }))
  }

  function toggleFeature(feature: string) {
    setSubmission((current) => ({ ...current, features: current.features.includes(feature) ? current.features.filter((item) => item !== feature) : [...current.features, feature] }))
  }

  function validateCurrent() {
    const next: Record<string,string> = {}
    if (step === 1) {
      if (!String(submission.owner.fullName).trim()) next.fullName = 'Enter your full name.'
      if (!String(submission.owner.mobile).trim()) next.mobile = 'Enter a mobile number.'
      if (!String(submission.owner.email).trim()) next.email = 'Enter an email address.'
    }
    if (step === 2) {
      if (!String(submission.property.compound).trim()) next.compound = 'Enter the compound or resort name.'
      if (!String(submission.property.area).trim()) next.area = 'Enter the Ain Sokhna area.'
      if (Number(submission.property.capacity) < 1) next.capacity = 'Enter a comfortable guest capacity.'
    }
    if (step === 3 && !submission.guestLove.trim()) next.guestLove = 'Tell us what guests usually love most.'
    if (step === 4 && submission.photos.length === 0) next.photos = 'Add at least one current photo to continue.'
    if (step === 5) {
      if (!submission.operations.checkIn) next.checkIn = 'Add a typical check-in time.'
      if (!submission.operations.checkOut) next.checkOut = 'Add a typical check-out time.'
    }
    if (step === 6 && !Object.values(submission.declarations).every(Boolean)) next.declarations = 'Please confirm all declarations.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function next() {
    if (!validateCurrent()) return
    setSubmission((current) => ({ ...current, step: Math.min(6, current.step + 1) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function previous() {
    setSubmission((current) => ({ ...current, step: Math.max(1, current.step - 1) }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setUploadProgress(5)
    const added: OwnerSubmission['photos'] = []
    for (let i = 0; i < files.length; i++) {
      try {
        const dataUrl = await compressImage(files[i])
        added.push({ name: files[i].name, category, dataUrl })
      } catch {}
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
    }
    setSubmission((current) => ({ ...current, photos: [...current.photos, ...added].slice(0, 16) }))
    setTimeout(() => setUploadProgress(0), 600)
    event.target.value = ''
  }

  function submit() {
    if (!validateCurrent()) return
    const now = new Date().toISOString()
    const final: OwnerSubmission = {
      ...submission,
      reference: submission.reference || makeReference('PROP'),
      createdAt: submission.createdAt || now,
      updatedAt: now,
      status: 'Submitted',
      step: 6,
      history: [...submission.history, { at: now, reviewer: 'Owner submission', previous: submission.status, next: 'Submitted', note: 'Submitted for review' }],
    }
    saveOwnerSubmission(final)
    clearOwnerDraft()
    router.push(`/submission-confirmation?reference=${encodeURIComponent(final.reference)}`)
  }

  const owner = submission.owner
  const property = submission.property
  const operations = submission.operations
  const commercial = submission.commercial

  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="shell"><div className="eyebrow">For owners</div><h1>Have a home made for this feeling?</h1><p>Little Hut is building a focused collection of well-prepared holiday homes in Ain Sokhna. Tell us about your property and we’ll review whether it is the right fit.</p><Notice tone="warning"><b>Takes approximately 7–10 minutes.</b> You can save and continue later. Submitting a property does not automatically publish it on Little Hut.</Notice></div></section>
      <section><div className="shell owner-wrap">
        <aside className="panel progress-panel" style={{padding:18}}>
          <div className="eyebrow">Progress · {step} of 6</div>
          <div className="progress-bar" aria-label={`${percent}% complete`}><span style={{width:`${percent}%`}} /></div>
          <ol className="progress-list">{steps.map((label,index) => <li key={label} className={step === index + 1 ? 'active' : step > index + 1 ? 'done' : ''}><span className="progress-number">{index + 1}</span><span>{label}</span></li>)}</ol>
          <p className="helper">Drafts are stored temporarily in this browser. Use the same device and browser to continue later.</p>
        </aside>

        <div className="owner-form">
          {step === 1 && <><div className="eyebrow">1 of 6</div><h2>First, who are we speaking with?</h2><div className="form-grid">
            <Field label="Full name" required error={errors.fullName}><input value={String(owner.fullName)} onChange={(e)=>updateGroup('owner','fullName',e.target.value)} /></Field>
            <Field label="Mobile number" required error={errors.mobile}><input inputMode="tel" value={String(owner.mobile)} onChange={(e)=>{updateGroup('owner','mobile',e.target.value); if(owner.sameAsMobile) updateGroup('owner','whatsapp',e.target.value)}} /></Field>
            <Field label="WhatsApp number"><input inputMode="tel" disabled={Boolean(owner.sameAsMobile)} value={String(owner.sameAsMobile ? owner.mobile : owner.whatsapp)} onChange={(e)=>updateGroup('owner','whatsapp',e.target.value)} /><label className="check-row"><input type="checkbox" checked={Boolean(owner.sameAsMobile)} onChange={(e)=>updateGroup('owner','sameAsMobile',e.target.checked)} />Same as mobile</label></Field>
            <Field label="Email" required error={errors.email}><input type="email" value={String(owner.email)} onChange={(e)=>updateGroup('owner','email',e.target.value)} /></Field>
            <Field label="Relationship to property"><select value={String(owner.relationship)} onChange={(e)=>updateGroup('owner','relationship',e.target.value)}>{['Owner','Authorised family representative','Property manager','Other'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Preferred contact"><select value={String(owner.preferredContact)} onChange={(e)=>updateGroup('owner','preferredContact',e.target.value)}>{['WhatsApp','Phone','Email'].map(x=><option key={x}>{x}</option>)}</select></Field>
          </div></>}

          {step === 2 && <><div className="eyebrow">2 of 6</div><h2>Tell us about the home</h2><div className="form-grid">
            <Field label="Property name, if any"><input value={String(property.propertyName)} onChange={(e)=>updateGroup('property','propertyName',e.target.value)} /></Field>
            <Field label="Compound or resort name" required error={errors.compound}><input value={String(property.compound)} onChange={(e)=>updateGroup('property','compound',e.target.value)} /></Field>
            <Field label="Ain Sokhna area" required error={errors.area}><input value={String(property.area)} onChange={(e)=>updateGroup('property','area',e.target.value)} /></Field>
            <Field label="Unit type"><select value={String(property.unitType)} onChange={(e)=>updateGroup('property','unitType',e.target.value)}>{['Chalet','Apartment','Villa','Townhouse','Twin house','Other'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Bedrooms"><input type="number" min="0" value={Number(property.bedrooms)} onChange={(e)=>updateGroup('property','bedrooms',Number(e.target.value))} /></Field>
            <Field label="Bathrooms"><input type="number" min="0" value={Number(property.bathrooms)} onChange={(e)=>updateGroup('property','bathrooms',Number(e.target.value))} /></Field>
            <Field label="Maximum comfortable guest capacity" required error={errors.capacity}><input type="number" min="1" value={Number(property.capacity)} onChange={(e)=>updateGroup('property','capacity',Number(e.target.value))} /></Field>
            <Field label="Floor, when applicable"><input value={String(property.floor)} onChange={(e)=>updateGroup('property','floor',e.target.value)} /></Field>
            <Field label="Lift"><select value={String(property.lift)} onChange={(e)=>updateGroup('property','lift',e.target.value)}>{['Yes','No','Not applicable'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Outdoor space"><select value={String(property.outdoorSpace)} onChange={(e)=>updateGroup('property','outdoorSpace',e.target.value)}>{['Balcony','Terrace','Garden','Roof','None'].map(x=><option key={x}>{x}</option>)}</select></Field>
          </div></>}

          {step === 3 && <><div className="eyebrow">3 of 6</div><h2>What makes the stay work?</h2><p className="helper">Selected high-impact features are flagged for verification before anything is published.</p><div className="feature-grid">{featureOptions.map(feature=><label className="check-row" key={feature}><input type="checkbox" checked={submission.features.includes(feature)} onChange={()=>toggleFeature(feature)} />{feature}{highImpact.includes(feature) && <span className="required"> · verify</span>}</label>)}</div><div className="form-grid" style={{marginTop:16}}><Field label="What do guests usually love most about the home?" required error={errors.guestLove} full><textarea value={submission.guestLove} onChange={(e)=>setSubmission(c=>({...c,guestLove:e.target.value}))} /></Field><Field label="Is anything shown in the photos shared, restricted or seasonal?" full><textarea value={submission.restrictions} onChange={(e)=>setSubmission(c=>({...c,restrictions:e.target.value}))} /></Field></div></>}

          {step === 4 && <><div className="eyebrow">4 of 6</div><h2>Show us the home as it really is</h2><Notice><b>Recent photos. Clear daylight preferred. No heavy filters.</b><br/>Do not show facilities guests cannot access. Professional photography is not required at submission stage.</Notice><div className="upload-zone" style={{marginTop:16}}><Field label="Photo category"><select value={category} onChange={(e)=>setCategory(e.target.value)}>{photoCategories.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Choose photos" error={errors.photos}><input type="file" accept="image/*" multiple onChange={handleFiles} /></Field>{uploadProgress>0 && <div><span className="helper">Compressing and saving photos… {uploadProgress}%</span><div className="progress-bar"><span style={{width:`${uploadProgress}%`}} /></div></div>}</div><div className="upload-list">{submission.photos.map((photo,index)=><div className="upload-item" key={`${photo.name}-${index}`}><img src={photo.dataUrl} alt={photo.category} /><b>{photo.category}</b><p className="helper">{photo.name}</p><button className="button ghost" type="button" onClick={()=>setSubmission(c=>({...c,photos:c.photos.filter((_,i)=>i!==index)}))}>Remove</button></div>)}</div><p className="helper">Required categories: {photoCategories.join(' · ')}</p></>}

          {step === 5 && <><div className="eyebrow">5 of 6</div><h2>Help us understand how stays are handled</h2><div className="form-grid">
            <Field label="Who prepares the home?"><select value={operations.preparation} onChange={(e)=>updateGroup('operations','preparation',e.target.value)}>{['My own team','Compound housekeeping','External cleaning team','Not arranged yet'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Who supports guests during the stay?"><select value={operations.support} onChange={(e)=>updateGroup('operations','support',e.target.value)}>{['Owner','Family representative','Property manager','Local operator','Not arranged yet'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Key or access method"><select value={operations.accessMethod} onChange={(e)=>updateGroup('operations','accessMethod',e.target.value)}>{['In person','Lockbox','Reception or security','Smart lock','Other'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Advance guest access"><select value={operations.advanceAccess} onChange={(e)=>updateGroup('operations','advanceAccess',e.target.value)}>{['Yes','No','Depends on compound'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Typical check-in time" required error={errors.checkIn}><input type="time" value={operations.checkIn} onChange={(e)=>updateGroup('operations','checkIn',e.target.value)} /></Field>
            <Field label="Typical check-out time" required error={errors.checkOut}><input type="time" value={operations.checkOut} onChange={(e)=>updateGroup('operations','checkOut',e.target.value)} /></Field>
            <Field label="Current listing channels"><input value={operations.channels} onChange={(e)=>updateGroup('operations','channels',e.target.value)} placeholder="Airbnb, Facebook, direct, none" /></Field>
            <Field label="Optional listing link"><input type="url" value={operations.listingLink} onChange={(e)=>updateGroup('operations','listingLink',e.target.value)} /></Field>
            <Field label="Operational information Little Hut should know" full><textarea value={operations.notes} onChange={(e)=>updateGroup('operations','notes',e.target.value)} /></Field>
          </div></>}

          {step === 6 && <><div className="eyebrow">6 of 6</div><h2>Last step</h2><div className="form-grid">
            <Field label="Preferred nightly rate, optional"><input inputMode="decimal" value={String(commercial.nightlyRate)} onChange={(e)=>updateGroup('commercial','nightlyRate',e.target.value)} /></Field>
            <Field label="Minimum stay"><input value={String(commercial.minimumStay)} onChange={(e)=>updateGroup('commercial','minimumStay',e.target.value)} placeholder="Example: 2 nights" /></Field>
            <Field label="Cleaning fee"><input inputMode="decimal" value={String(commercial.cleaningFee)} onChange={(e)=>updateGroup('commercial','cleaningFee',e.target.value)} /></Field>
            <Field label="Security deposit"><input inputMode="decimal" value={String(commercial.securityDeposit)} onChange={(e)=>updateGroup('commercial','securityDeposit',e.target.value)} /></Field>
            <Field label="Availability"><select value={String(commercial.availability)} onChange={(e)=>updateGroup('commercial','availability',e.target.value)}>{['All year','Selected dates','Not confirmed yet'].map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Approximate available dates, optional"><input value={String(commercial.approximateDates)} onChange={(e)=>updateGroup('commercial','approximateDates',e.target.value)} /></Field>
            <Field label="Can Little Hut discuss pricing recommendations?"><select value={String(commercial.pricingAdvice)} onChange={(e)=>updateGroup('commercial','pricingAdvice',e.target.value)}>{['Yes','No'].map(x=><option key={x}>{x}</option>)}</select></Field>
          </div><div style={{marginTop:20}}><div className="group-label">Owner declarations</div>{[
            ['authorised','I confirm I am authorised to submit this property.'],['accurate','The information and photos are accurate to the best of my knowledge.'],['noGuarantee','I understand that submission does not guarantee acceptance or publication.'],['verification','Little Hut may contact me to verify the property and operating arrangements.'],['noPublication','No property information will be published without approval.']
          ].map(([key,label])=><label className="check-row" key={key}><input type="checkbox" checked={Boolean(submission.declarations[key])} onChange={(e)=>updateGroup('declarations',key,e.target.checked)} />{label}</label>)}{errors.declarations && <p className="error">{errors.declarations}</p>}</div><Notice tone="warning">Owner-entered rates and amenities are treated as unverified until reviewed. No property is published automatically.</Notice></>}

          <div className="form-actions"><button className="button ghost" type="button" onClick={previous} disabled={step===1}>Previous</button>{step<6 ? <button className="button" type="button" onClick={next}>Next</button> : <button className="button" type="button" onClick={submit}>Submit for review</button>}</div>
        </div>
      </div></section>
    </main>
    <SiteFooter />
  </>
}

function Field({label,required,error,children,full=false}:{label:string;required?:boolean;error?:string;children:React.ReactNode;full?:boolean}) {
  return <div className={`field${full?' full':''}`}><label>{label}{required && <span className="required"> *</span>}</label>{children}{error && <span className="error">{error}</span>}</div>
}
