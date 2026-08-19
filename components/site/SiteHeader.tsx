'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { SiteLanguageToggle } from './SiteLanguageToggle'

const copy = {
  en: {
    moments: 'Moments',
    homes: 'Homes',
    track: 'My stay',
    owners: 'For owners',
    cta: 'Find your Moment',
    menu: 'Open menu',
  },
  ar: {
    moments: 'اللحظات',
    homes: 'البيوت',
    track: 'إقامتي',
    owners: 'للمُلّاك',
    cta: 'ابحث عن لحظتك',
    menu: 'افتح القائمة',
  },
}

export function SiteHeader() {
  const { language } = useLanguage()
  const labels = copy[language]

  return (
    <header className="site-header">
      <div className="site-shell nav-row">
        <Link className="brand" href="/" aria-label="Little Hut Vacations home">
          <span className="brand-mark" aria-hidden="true">LH</span>
          <span>LITTLE HUT<small>VACATIONS</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/#moments">{labels.moments}</Link>
          <Link href="/stays">{labels.homes}</Link>
          <Link href="/track">{labels.track}</Link>
          <Link href="/owners/apply">{labels.owners}</Link>
        </nav>
        <div className="desktop-actions">
          <SiteLanguageToggle />
          <Link className="button button-small button-primary" href="/#moments">
            {labels.cta}
          </Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label={labels.menu}><Menu /></summary>
          <nav>
            <Link href="/#moments">{labels.moments}</Link>
            <Link href="/stays">{labels.homes}</Link>
            <Link href="/track">{labels.track}</Link>
            <Link href="/owners/apply">{labels.owners}</Link>
            <SiteLanguageToggle />
          </nav>
        </details>
      </div>
    </header>
  )
}
