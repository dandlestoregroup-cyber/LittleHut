'use client'

import Link from 'next/link'
import { useState } from 'react'
import { OFFICIAL_PHONE, whatsappUrl } from '@/lib/lhv-store'

export function BrandMark() {
  return (
    <Link className="brand" href="/" aria-label="Little Hut Vacations home">
      <span className="brand-mark" aria-hidden="true">⌂</span>
      <span><b>LITTLE HUT</b><small>VACATIONS</small></span>
    </Link>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <header className="site-header">
      <div className="shell nav-row">
        <BrandMark />
        <button className="menu-button" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(!open)}>Menu</button>
        <nav id="main-nav" className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          <Link href="/#stays" onClick={close}>Stays</Link>
          <Link href="/#feeling" onClick={close}>The feeling</Link>
          <Link href="/#sokhna" onClick={close}>Ain Sokhna</Link>
          <Link href="/list-your-property" onClick={close}>For owners</Link>
          <a href={whatsappUrl('Hello Little Hut Vacations, I would like to ask about a stay.')} target="_blank" rel="noreferrer" onClick={close}>WhatsApp</a>
          <Link className="button small" href="/list-your-property" onClick={close}>List your property</Link>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <BrandMark />
          <p>Direct enquiry by Little Hut Vacations.</p>
        </div>
        <div>
          <b>Official contact</b>
          <a href={`tel:${OFFICIAL_PHONE}`}>{OFFICIAL_PHONE}</a>
        </div>
        <div>
          <b>Owner journey</b>
          <Link href="/list-your-property">Submit a property</Link>
          <Link href="/submission-status">Check submission status</Link>
        </div>
        <div>
          <b>Privacy note</b>
          <p>Guest and owner information is used only to review enquiries and submissions.</p>
        </div>
      </div>
    </footer>
  )
}

export function Notice({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'success' | 'warning' }) {
  return <div className={`notice ${tone}`}>{children}</div>
}
