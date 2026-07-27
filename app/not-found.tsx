import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/little-hut/SiteChrome'

export default function NotFound() {
  return <><SiteHeader /><main className="not-found"><div><div className="eyebrow">Page not found</div><h1>404</h1><h2 className="serif">Nothing urgent. Just the wrong turn.</h2><p>Return to Little Hut and find your few days.</p><Link className="button" href="/">Back to the homepage</Link></div></main><SiteFooter /></>
}
