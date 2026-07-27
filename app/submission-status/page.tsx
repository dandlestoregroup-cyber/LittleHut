'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Notice, SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { OwnerSubmission, getOwnerSubmission } from '@/lib/lhv-store'

const publicStatuses = ['Draft','Submitted','More information needed','Review call requested','Property visit requested','Approved in principle','Not currently a fit','Onboarding agreement pending','Ready for publication']

export default function SubmissionStatusPage() {
  const params = useSearchParams()
  const initialReference = params.get('reference') || ''
  const [reference, setReference] = useState(initialReference)
  const [submission, setSubmission] = useState<OwnerSubmission | null>(() => initialReference ? getOwnerSubmission(initialReference) : null)
  const [searched, setSearched] = useState(Boolean(initialReference))

  function search(event: FormEvent) {
    event.preventDefault()
    setSubmission(getOwnerSubmission(reference.trim()))
    setSearched(true)
  }

  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="shell"><div className="eyebrow">Owner status</div><h1>Check your property submission</h1><p>Enter the reference shown after submission. For this Phase 1 release, status recovery works on the same browser and device used to submit.</p></div></section>
      <section><div className="shell confirmation-grid">
        <div className="status-card">
          <form className="status-search" onSubmit={search}><input aria-label="Submission reference" value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="PROP-YYYYMMDD-XXXXX" /><button className="button">Check status</button></form>
          {searched && !submission && <Notice tone="warning">No submission was found in this browser. Check the reference and use the same device and browser used for submission.</Notice>}
          {submission && <>
            <div style={{marginTop:20}}><span className="status-badge">{publicStatuses.includes(submission.status) ? submission.status : 'Submitted'}</span></div>
            <div className="summary-list">
              <div className="summary-item"><span>Reference</span><b>{submission.reference}</b></div>
              <div className="summary-item"><span>Property</span><b>{String(submission.property.propertyName || 'Unnamed property')}</b></div>
              <div className="summary-item"><span>Owner</span><b>{String(submission.owner.fullName)}</b></div>
              <div className="summary-item"><span>Last updated</span><b>{new Date(submission.updatedAt).toLocaleString('en-GB')}</b></div>
            </div>
            <div className="timeline">{submission.history.map((item,index)=><div className="timeline-item" key={`${item.at}-${index}`}><b>{item.next}</b><p>{new Date(item.at).toLocaleString('en-GB')}</p>{item.note && <p>{item.note}</p>}</div>)}</div>
          </>}
        </div>
        <aside className="panel" style={{padding:26}}><div className="eyebrow">Possible statuses</div><ul>{publicStatuses.map(status=><li key={status}>{status}</li>)}</ul><p className="helper">Internal review notes are never shown on this page.</p></aside>
      </div></section>
    </main>
    <SiteFooter />
  </>
}
