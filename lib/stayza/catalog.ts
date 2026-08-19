import type { StayProperty } from './types'

export const properties: StayProperty[] = [
  {
    id: 'prop-salty-life-villa',
    slug: 'salty-life-villa',
    name: 'Salty Life Villa',
    location: 'Azha, Ain Sokhna',
    locationAr: 'أزها، العين السخنة',
    summary: 'A private family villa in Azha with a calm lagoon setting.',
    summaryAr: 'فيلا عائلية خاصة في أزها بإطلالة هادئة على اللاجون.',
    description:
      'A Little Hut stay created for unhurried family days, long evenings, and the kind of quiet that begins as soon as the city disappears behind you.',
    descriptionAr:
      'إقامة من ليتل هَت لأيام عائلية بلا استعجال، وأمسيات طويلة، وهدوء يبدأ فور ابتعاد المدينة.',
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
      'Reported lagoon setting',
      'Reported family living space',
      'Reported private outdoor space',
    ],
    featuresAr: [
      'إطلالة لاجون مقدّمة من المصدر',
      'مساحة معيشة عائلية مقدّمة من المصدر',
      'مساحة خارجية خاصة مقدّمة من المصدر',
    ],
    truthStatus: 'joining',
    bookingEnabled: false,
    mediaStatus: 'editorial-teaser',
    sourceNote:
      'Source-provided information suggests a family villa with a calm lagoon setting. Little Hut has not yet completed the verification visit or approved property media for public evidence.',
    sourceNoteAr:
      'تشير المعلومات المقدّمة من المصدر إلى فيلا عائلية بإطلالة هادئة على اللاجون. لم تكمل ليتل هَت بعد زيارة التحقق أو اعتماد صور العقار كدليل عام.',
    honestLimitations: [
      'Little Hut verification visit is not complete.',
      'Public property photography and media rights are not yet approved.',
      'Availability and pricing are intentionally not published.',
    ],
    honestLimitationsAr: [
      'زيارة التحقق من ليتل هَت غير مكتملة.',
      'صور العقار العامة وحقوق استخدامها غير معتمدة بعد.',
      'التوافر والأسعار غير منشورين عمداً.',
    ],
    momentMatches: [
      {
        moment: 'slow-mornings',
        status: 'potential',
        reason: 'The reported lagoon setting may support quiet outdoor mornings.',
        reasonAr: 'قد تساعد إطلالة اللاجون المقدّمة من المصدر على صباح هادئ في الخارج.',
        evidenceSource: 'source-reported',
      },
      {
        moment: 'little-moments',
        status: 'potential',
        reason: 'The reported family living space may suit relaxed shared time.',
        reasonAr: 'قد تناسب مساحة المعيشة العائلية المقدّمة من المصدر وقتاً مشتركاً ومريحاً.',
        evidenceSource: 'source-reported',
      },
      {
        moment: 'after-sunset',
        status: 'potential',
        reason: 'The reported private outdoor space may suit evenings together.',
        reasonAr: 'قد تناسب المساحة الخارجية الخاصة المقدّمة من المصدر أمسيات مشتركة.',
        evidenceSource: 'source-reported',
      },
      {
        moment: 'stars-and-silence',
        status: 'potential',
        reason: 'The reported setting may offer a quieter night experience.',
        reasonAr: 'قد يوفّر الموقع المقدّم من المصدر تجربة ليلية أكثر هدوءاً.',
        evidenceSource: 'source-reported',
      },
      {
        moment: 'time-without-planning',
        status: 'potential',
        reason: 'The reported self-contained family setup may support an easy day in.',
        reasonAr: 'قد يساعد تجهيز البيت العائلي المقدّم من المصدر على قضاء يوم سهل بلا خطط.',
        evidenceSource: 'source-reported',
      },
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

export function getBookablePropertyById(id: string) {
  return properties.find(
    (property) =>
      property.id === id &&
      property.active &&
      property.truthStatus === 'verified' &&
      property.bookingEnabled &&
      property.mediaStatus === 'approved-property',
  )
}

export function isPubliclyBookable(property: StayProperty) {
  return (
    property.active &&
    property.truthStatus === 'verified' &&
    property.bookingEnabled &&
    property.mediaStatus === 'approved-property'
  )
}

export function getPropertyBySlug(slug: string) {
  return properties.find(
    (property) => property.slug === slug && property.active,
  )
}
