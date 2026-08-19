import { NextResponse } from 'next/server'
import { properties } from '@/lib/stayza/catalog'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    properties: properties
      .filter((property) => property.active)
      .map((property) => {
        const verifiedAndBookable =
          property.truthStatus === 'verified' &&
          property.bookingEnabled &&
          property.mediaStatus === 'approved-property'

        return {
          id: property.id,
          slug: property.slug,
          name: property.name,
          location: property.location,
          locationAr: property.locationAr,
          summary: property.summary,
          summaryAr: property.summaryAr,
          propertyType: property.propertyType,
          truthStatus: property.truthStatus,
          bookingEnabled: verifiedAndBookable,
          mediaStatus: property.mediaStatus,
          sourceNote: property.sourceNote,
          sourceNoteAr: property.sourceNoteAr,
          honestLimitations: property.honestLimitations,
          honestLimitationsAr: property.honestLimitationsAr,
          momentMatches: property.momentMatches,
          heroImage: property.heroImage,
          features: property.features,
          featuresAr: property.featuresAr,
          ...(verifiedAndBookable
            ? {
                maxGuests: property.maxGuests,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                minimumNights: property.minimumNights,
                fromRate: property.minimumSuggestedRate,
                currency: property.currency,
              }
            : {}),
        }
      }),
  })
}
