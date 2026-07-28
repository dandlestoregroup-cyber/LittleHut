import Link from 'next/link'
import { Menu } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell nav-row">
        <Link className="brand" href="/" aria-label="Little Hut Vacations home">
          <span className="brand-mark">⌂</span>
          <span>LITTLE HUT<small>VACATIONS</small></span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/stays">Stays</Link>
          <Link href="/track">Track booking</Link>
          <Link href="/owners/apply">For owners</Link>
        </nav>
        <Link className="button button-small button-primary desktop-nav" href="/#search">
          Check dates
        </Link>
        <details className="mobile-menu">
          <summary aria-label="Open menu"><Menu /></summary>
          <nav>
            <Link href="/stays">Stays</Link>
            <Link href="/track">Track booking</Link>
            <Link href="/owners/apply">For owners</Link>
          </nav>
        </details>
      </div>
    </header>
  )
}
