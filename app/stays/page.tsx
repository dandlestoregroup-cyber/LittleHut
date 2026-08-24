import { StaysExplorer } from '@/components/stays/StaysExplorer'
import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { properties } from '@/lib/stayza/catalog'
import { publicPropertyView } from '@/lib/stayza/access'

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function StaysPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestedGuests = Number(valueOf(params.guests))
  const guests = Number.isInteger(requestedGuests)
    ? Math.min(8, Math.max(1, requestedGuests))
    : 2
  // Projected through the single canonical audience gate rather than a local
  // field list, so this page can never drift from the public API's view.
  const publicHomes = properties
    .filter((property) => property.active)
    .map(publicPropertyView)

  return (
    <main className="page-background">
      <SiteHeader />
      <StaysExplorer
        homes={publicHomes}
        search={{
          checkIn: valueOf(params.checkIn),
          checkOut: valueOf(params.checkOut),
          guests,
          moment: valueOf(params.moment),
        }}
      />
      <SiteFooter />
    </main>
  )
}
