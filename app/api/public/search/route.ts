import { NextResponse } from 'next/server'
import { properties } from '@/lib/stayza/catalog'
import { assertNoSecretFields, publicPropertyView } from '@/lib/stayza/access'
import { apiError } from '@/lib/stayza/http'
import { buildQuote } from '@/lib/stayza/pricing'
import { availablePropertyIds } from '@/lib/stayza/service'
import { searchSchema } from '@/lib/stayza/validation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const input = searchSchema.parse({
      checkIn: url.searchParams.get('checkIn'),
      checkOut: url.searchParams.get('checkOut'),
      guests: url.searchParams.get('guests'),
    })
    const available = new Set(await availablePropertyIds(input))
    const results = properties
      .filter((property) => available.has(property.id))
      .map((property) => ({
        property: publicPropertyView(property),
        quote: buildQuote({
          propertyId: property.id,
          ...input,
        }),
      }))

    const payload = { search: input, results }
    assertNoSecretFields(payload, 'public search')
    return NextResponse.json(payload)
  } catch (error) {
    return apiError(error)
  }
}
