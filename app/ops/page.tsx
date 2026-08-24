import type { Metadata } from 'next'
import { OpsConsole } from '@/components/ops/OpsConsole'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { operatorAuthConfigured } from '@/lib/ops/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Operations · Little Hut',
  // The console must never be indexed or previewed by crawlers.
  robots: { index: false, follow: false, nocache: true },
}

export default function OpsPage() {
  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero">
        <div className="site-shell">
          <span className="eyebrow">Stayza operations</span>
          <h1>Run the day.</h1>
          <p>
            Booking requests, owner applications and the exceptions queue — the
            work that needs a human decision, in one place.
          </p>
        </div>
      </section>
      <section className="section section-paper">
        <div className="site-shell">
          <OpsConsole configured={operatorAuthConfigured()} />
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
