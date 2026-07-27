'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const PHONE='01270228656'
const WA='201270228656'

export default function OwnerConfirmationPage(){
  const [submission,setSubmission]=useState<any>(null)
  useEffect(()=>{try{const raw=localStorage.getItem('lhv-last-submission');if(raw)setSubmission(JSON.parse(raw))}catch{}},[])
  return <main className="page-shell"><div className="page-head"><Link className="brand" href="/"><span className="brand-mark">⌂</span><span>LITTLE HUT<small>VACATIONS</small></span></Link></div><section className="wizard"><p className="eyebrow">PROPERTY SUBMISSION</p><h1>Your property has been submitted</h1><p>Thank you. The Little Hut team will review the property, photos and operating setup.</p><h2>What happens next</h2><ol><li>We review the submission.</li><li>We contact you if anything needs clarification.</li><li>We may arrange a call or property visit.</li><li>If the home fits the collection, we discuss the next steps before anything is published.</li></ol>{submission?<div className="honest-panel"><p><strong>Submission reference:</strong> {submission.reference}</p><p><strong>Property name:</strong> {submission.propertyName||'Not provided'}</p><p><strong>Owner name:</strong> {submission.fullName}</p><p><strong>Submission date:</strong> {new Date(submission.submittedAt).toLocaleString()}</p><p><strong>Status:</strong> <span className="status-badge">Under review</span></p></div>:<p className="form-error">No recent submission was found in this browser.</p>}<div className="actions"><Link className="button" href="/owner-status">View submission</Link><Link className="button secondary" href="/list-your-property">Add more photos</Link><a className="text-link" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">Contact Little Hut on WhatsApp · {PHONE}</a></div></section></main>
}
