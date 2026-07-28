import type { StayProperty } from './types'

export const properties: StayProperty[] = [
  {
    id: 'prop-salty-life-villa',
    slug: 'salty-life-villa',
    name: 'Salty Life Villa',
    location: 'Azha, Ain Sokhna',
    summary: 'A private family villa in Azha with a calm lagoon setting.',
    description:
      'A Little Hut stay created for unhurried family days, long evenings, and the kind of quiet that begins as soon as the city disappears behind you.',
    propertyType: 'villa',
    maxGuests: 8,
    bedrooms: 3,
    bathrooms: 3,
    baseNightlyRate: 7000,
    minimumSuggestedRate: 7000,
    minimumNights: 2,
    currency: 'EGP',
    heroImage:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1800&q=88',
    gallery: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
    ],
    features: [
      'Lagoon setting',
      'Family-ready living space',
      'Private outdoor space',
      'Local guest support',
      'Direct Stayza booking record',
    ],
    // The pricing engine supports dated seasons. Until a dated override is
    // approved, the explicitly supplied EGP 7,000 nightly rate is used.
    ratePeriods: [],
    active: true,
  },
]

export function getPropertyById(id: string) {
  return properties.find((property) => property.id === id && property.active)
}

export function getPropertyBySlug(slug: string) {
  return properties.find(
    (property) => property.slug === slug && property.active,
  )
}
