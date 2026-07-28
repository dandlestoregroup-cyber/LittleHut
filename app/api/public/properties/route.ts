import { NextResponse } from 'next/server'
import { properties } from '@/lib/stayza/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    properties: properties
      .filter((property) => property.active)
      .map((property) => ({
        id: property.id,
        slug: property.slug,
        name: property.name,
        location: property.location,
        summary: property.summary,
        propertyType: property.propertyType,
        maxGuests: property.maxGuests,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        minimumNights: property.minimumNights,
        fromRate: property.minimumSuggestedRate,
        currency: property.currency,
        heroImage: property.heroImage,
        features: property.features,
      })),
  })
}
