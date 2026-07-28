import { OwnerApplicationForm } from '@/components/owners/OwnerApplicationForm'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function OwnerApplyPage() {
  return (
    <main className="page-background">
      <SiteHeader />
      <section className="page-hero owner-page-hero">
        <div className="site-shell">
          <span className="eyebrow">For owners</span>
          <h1>Not every home becomes a Little Hut.</h1>
          <p>
            Tell us how your property is operated. The application is saved in
            Stayza for structured review; submission does not promise acceptance.
          </p>
        </div>
      </section>
      <section className="section section-paper">
        <OwnerApplicationForm />
      </section>
      <SiteFooter />
    </main>
  )
}
