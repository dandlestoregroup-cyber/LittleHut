import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'
import { OFFICIAL_PHONE, whatsappUrl } from '@/lib/lhv-store'

export const metadata = {
  title: 'Salty Life Villa',
  description: 'A verified Little Hut property in Ain Sokhna. Property facts and availability are shared after enquiry.',
}

export default function SaltyLifeVillaPage() {
  return <>
    <SiteHeader />
    <main>
      <section className="page-hero"><div className="shell"><div className="eyebrow">Verified Little Hut property</div><h1>Salty Life Villa</h1><p>Ain Sokhna. This page deliberately publishes only facts supported by the current source material.</p></div></section>
      <section><div className="shell stay-grid" style={{paddingBottom:70}}>
        <article className="stay-card">
          <img src="/Photoroom-20240618_102051.png" alt="Salty Life Villa reference image" />
          <div className="content">
            <h2 className="serif">What is confirmed</h2>
            <div className="fact-list"><span className="fact">Little Hut property</span><span className="fact">Ain Sokhna</span><span className="fact">Enquiry-led availability</span></div>
            <p>Nightly price, capacity, bed count, compound facilities, views and access are not published until the supporting property source is reviewed for this release.</p>
            <div className="notice warning">This is an enquiry page, not a live availability or payment engine. Sending an enquiry does not confirm a reservation.</div>
            <div className="action-row"><Link className="button" href="/#enquiry">Tell us your dates</Link><a className="button secondary" href={whatsappUrl('Hello Little Hut Vacations, I would like to ask about Salty Life Villa.')} target="_blank" rel="noreferrer">Ask on WhatsApp · {OFFICIAL_PHONE}</a></div>
          </div>
        </article>
        <aside className="coming-card"><div className="eyebrow">The Little Hut approach</div><h3>We check the facts before we make the promise.</h3><p>Availability, rates and operating details are confirmed through a direct conversation for the requested dates.</p></aside>
      </div></section>
    </main>
    <SiteFooter />
  </>
}
