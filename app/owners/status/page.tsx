import { OwnerApplicationTracker } from '@/components/owners/OwnerApplicationTracker'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function OwnerStatusPage() {
  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero">
        <div className="site-shell">
          <span className="eyebrow">Owner application record</span>
          <h1>Track your submission.</h1>
          <p>
            Enter the reference from your confirmation along with the email you
            applied with. Only you can see your own application.
          </p>
        </div>
      </section>
      <section className="section section-paper">
        <OwnerApplicationTracker />
      </section>
      <SiteFooter />
    </main>
  )
}
