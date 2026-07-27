'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { OFFICIAL_PHONE, getOwnerSubmission, whatsappUrl } from '@/lib/lhv-store'

export default function SubmissionConfirmationPage() {
  const params = useSearchParams()
  const reference = params.get('reference') || ''
  const submission = reference ? getOwnerSubmission(reference) : null

  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="shell"><div className="eyebrow">Property submission</div><h1>Your property has been submitted</h1><p>Thank you. The Little Hut team will review the property, photos and operating setup.</p></div></section>
      <section><div className="shell confirmation-grid">
        <div className="status-card">
          <span className="status-badge">Under review</span>
          <div className="summary-list">
            <div className="summary-item"><span>Submission reference</span><b>{submission?.reference || reference || 'Not found'}</b></div>
            <div className="summary-item"><span>Property name</span><b>{String(submission?.property.propertyName || 'Not provided')}</b></div>
            <div className="summary-item"><span>Owner name</span><b>{String(submission?.owner.fullName || 'Not available')}</b></div>
            <div className="summary-item"><span>Submission date</span><b>{submission?.createdAt ? new Date(submission.createdAt).toLocaleDateString('en-GB') : 'Not available'}</b></div>
          </div>
          <div className="action-row">
            <Link className="button" href={`/submission-status?reference=${encodeURIComponent(reference)}`}>View submission</Link>
            <Link className="button secondary" href="/list-your-property">Add more photos</Link>
            <a className="button ghost" href={whatsappUrl(`Hello Little Hut Vacations, I am following up on property submission ${reference}.`)} target="_blank" rel="noreferrer">Contact Little Hut on WhatsApp</a>
          </div>
          <p className="helper">Official WhatsApp: {OFFICIAL_PHONE}</p>
        </div>
        <aside className="panel" style={{padding:26}}><div className="eyebrow">What happens next</div><div className="timeline">
          <div className="timeline-item"><b>1. We review the submission.</b></div>
          <div className="timeline-item"><b>2. We contact you if anything needs clarification.</b></div>
          <div className="timeline-item"><b>3. We may arrange a call or property visit.</b></div>
          <div className="timeline-item"><b>4. If the home fits the collection, we discuss the next steps before anything is published.</b></div>
        </div></aside>
      </div></section>
    </main>
    <SiteFooter />
  </>
}
