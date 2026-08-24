import { NextResponse } from 'next/server'
import { properties } from '@/lib/stayza/catalog'
import { assertNoSecretFields, publicPropertyView } from '@/lib/stayza/access'

export const dynamic = 'force-dynamic'

export async function GET() {
  const payload = {
    properties: properties
      .filter((property) => property.active)
      .map(publicPropertyView),
  }
  assertNoSecretFields(payload, 'public properties')
  return NextResponse.json(payload)
}
