'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const statuses=['Draft','Submitted','More information needed','Review call requested','Property visit requested','Approved in principle','Not currently a fit','Onboarding agreement pending','Ready for publication']

export default function OwnerStatusPage(){
  const [items,setItems]=useState<any[]>([])
  const [query,setQuery]=useState('')
  useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem('lhv-owner-submissions')||'[]'))}catch{}},[])
  const matches=items.filter(x=>!query||x.reference?.toLowerCase().includes(query.toLowerCase())||x.mobile?.includes(query)||x.email?.toLowerCase().includes(query.toLowerCase()))
  return <main className="page-shell"><div className="page-head"><Link className="brand" href="/"><span className="brand-mark">⌂</span><span>LITTLE HUT<small>VACATIONS</small></span></Link><Link className="text-link" href="/list-your-property">New submission</Link></div><section className="section-intro"><p className="eyebrow">OWNER STATUS</p><h2>Check your property submission</h2><p>This Phase 1 status page reads submissions saved in this browser. Use the same device and browser used for submission.</p></section><div className="wizard"><label>Reference, mobile number or email<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="LHV-P-..." /></label>{matches.length===0?<p className="muted">No matching submission was found in this browser.</p>:matches.map(item=><article className="honest-panel" key={item.reference}><div className="page-head"><div><h3>{item.propertyName||'Unnamed property'}</h3><p>{item.reference}</p></div><span className="status-badge">{item.status||'Submitted'}</span></div><p><strong>Submitted:</strong> {new Date(item.submittedAt).toLocaleString()}</p><p><strong>Compound:</strong> {item.compound}</p><p><strong>Current stage:</strong> {statuses.includes(item.status)?item.status:'Submitted'}</p><details><summary>View status history</summary><ul>{(item.history||[]).map((h:any,i:number)=><li key={i}>{new Date(h.timestamp).toLocaleString()} — {h.previousStatus} → {h.newStatus}</li>)}</ul></details></article>)}</div></main>
}
