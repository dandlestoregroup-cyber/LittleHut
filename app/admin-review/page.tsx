'use client'

import { useEffect, useState } from 'react'
import { Notice, SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { OwnerSubmission, getOwnerSubmissions, saveOwnerSubmission } from '@/lib/lhv-store'

const statuses = ['Submitted','More information needed','Review call requested','Property visit requested','Approved in principle','Not currently a fit','Onboarding agreement pending','Ready for publication']
const TEMP_CODE = 'LHV-REVIEW-2026'

export default function AdminReviewPage() {
  const [authorised, setAuthorised] = useState(false)
  const [code, setCode] = useState('')
  const [items, setItems] = useState<OwnerSubmission[]>([])
  const [selectedRef, setSelectedRef] = useState('')
  const [reviewer, setReviewer] = useState('Little Hut reviewer')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (window.sessionStorage.getItem('lhv_admin_access') === 'yes') setAuthorised(true)
  }, [])

  useEffect(() => {
    if (!authorised) return
    const found = getOwnerSubmissions()
    setItems(found)
    if (!selectedRef && found[0]) setSelectedRef(found[0].reference)
  }, [authorised, selectedRef])

  const selected = items.find((item) => item.reference === selectedRef) || null

  function login() {
    if (code === TEMP_CODE) {
      window.sessionStorage.setItem('lhv_admin_access','yes')
      setAuthorised(true)
    }
  }

  function changeStatus(next: string) {
    if (!selected) return
    const now = new Date().toISOString()
    const updated: OwnerSubmission = {
      ...selected,
      status: next,
      updatedAt: now,
      history: [...selected.history, { at: now, reviewer: reviewer || 'Reviewer', previous: selected.status, next, note: note || undefined }],
    }
    saveOwnerSubmission(updated)
    const nextItems = getOwnerSubmissions()
    setItems(nextItems)
    setNote('')
  }

  if (!authorised) return <><SiteHeader /><main><section className="admin-login"><div className="admin-card"><div className="eyebrow">Private review area</div><h1 className="serif">Admin access</h1><p>This Phase 1 access gate protects the browser-local review screen. It is not a replacement for production identity and role management.</p><div className="field"><label>Review access code</label><input type="password" value={code} onChange={(e)=>setCode(e.target.value)} onKeyDown={(e)=>{if(e.key==='Enter') login()}} /></div><button className="button" onClick={login}>Enter review area</button></div></section></main><SiteFooter /></>

  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="shell"><div className="eyebrow">Internal review</div><h1>Property submissions</h1><Notice tone="warning">Temporary Phase 1 persistence: submissions and status history are stored in this browser only. Do not treat this as a shared production database.</Notice></div></section>
      <section><div className="shell admin-grid">
        <aside className="admin-card"><div className="eyebrow">Submissions</div><div className="submission-list">{items.length === 0 && <p>No submissions saved in this browser.</p>}{items.map((item)=><button key={item.reference} className={item.reference===selectedRef?'submission-button active':'submission-button'} onClick={()=>setSelectedRef(item.reference)}><b>{String(item.property.propertyName || 'Unnamed property')}</b><br/><span className="helper">{item.reference} · {item.status}</span></button>)}</div></aside>
        <div className="admin-card">
          {!selected && <p>Select a submission.</p>}
          {selected && <>
            <div className="section-head"><div><div className="eyebrow">{selected.reference}</div><h2>{String(selected.property.propertyName || 'Unnamed property')}</h2></div><span className="status-badge">{selected.status}</span></div>
            <div className="summary-list">
              <div className="summary-item"><span>Owner</span><b>{String(selected.owner.fullName)}</b><p>{String(selected.owner.mobile)}<br/>{String(selected.owner.email)}</p></div>
              <div className="summary-item"><span>Property</span><b>{String(selected.property.unitType)} · {String(selected.property.compound)}</b><p>{String(selected.property.area)}<br/>{String(selected.property.capacity)} comfortable guests claimed</p></div>
              <div className="summary-item"><span>Operations</span><b>{selected.operations.preparation}</b><p>Guest support: {selected.operations.support}<br/>Access: {selected.operations.accessMethod}</p></div>
              <div className="summary-item"><span>Commercial expectations</span><b>{String(selected.commercial.nightlyRate || 'No preferred nightly rate')}</b><p>Minimum stay: {String(selected.commercial.minimumStay || 'Not provided')}<br/>Availability: {String(selected.commercial.availability)}</p></div>
            </div>
            <div className="admin-section"><h3>Amenities and verification flags</h3><div className="fact-list">{selected.features.map((feature)=><span className="fact" key={feature}>{feature}</span>)}</div><p><b>Guests usually love:</b> {selected.guestLove || 'Not provided'}</p><p><b>Shared, restricted or seasonal:</b> {selected.restrictions || 'Not provided'}</p></div>
            <div className="admin-section"><h3>Photo gallery</h3><div className="admin-photo-grid">{selected.photos.map((photo,index)=><figure key={`${photo.name}-${index}`}><img src={photo.dataUrl} alt={photo.category}/><figcaption className="helper">{photo.category}</figcaption></figure>)}</div></div>
            <div className="admin-section"><h3>Review action</h3><div className="form-grid"><div className="field"><label>Assigned reviewer</label><input value={reviewer} onChange={(e)=>setReviewer(e.target.value)} /></div><div className="field full"><label>Internal note</label><textarea value={note} onChange={(e)=>setNote(e.target.value)} /></div></div><div className="action-row">{statuses.map((status)=><button className={status==='Not currently a fit'?'button secondary':'button'} key={status} onClick={()=>changeStatus(status)}>{status}</button>)}</div></div>
            <div className="admin-section"><h3>Status history</h3><div className="timeline">{selected.history.slice().reverse().map((item,index)=><div className="timeline-item" key={`${item.at}-${index}`}><b>{item.previous} → {item.next}</b><p>{new Date(item.at).toLocaleString('en-GB')} · {item.reviewer}</p>{item.note && <p>{item.note}</p>}</div>)}</div></div>
          </>}
        </div>
      </div></section>
    </main>
    <SiteFooter />
  </>
}
