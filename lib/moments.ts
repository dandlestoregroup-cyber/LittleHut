export type MomentSlug =
  | 'slow-mornings'
  | 'the-morning-stayed-slow'
  | 'after-sunset'
  | 'little-moments'
  | 'stars-and-silence'
  | 'late-breakfast'
  | 'their-room'
  | 'soft-sheets'
  | 'good-food'
  | 'time-without-planning'

export type DayPhase = 'dawn' | 'day' | 'sunset' | 'evening' | 'night'

export interface MomentDefinition {
  slug: MomentSlug
  phase: DayPhase
  title: { en: string; ar: string }
  phrase: { en: string; ar: string }
  context: { en: string; ar: string }
  image: string
  imagePosition?: string
}

export const moments: MomentDefinition[] = [
  {
    slug: 'slow-mornings',
    phase: 'dawn',
    title: { en: 'Slow mornings', ar: 'صباحات على مهل' },
    phrase: { en: 'No rush. Just us.', ar: 'لا عجلة. نحن فقط.' },
    context: {
      en: 'Homes with a quiet place to let breakfast take its time.',
      ar: 'بيوت تمنح الإفطار والحديث الهادئ كل الوقت الذي يحتاجانه.',
    },
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'the-morning-stayed-slow',
    phase: 'dawn',
    title: { en: 'The morning stayed slow', ar: 'واستمر الصباح هادئاً' },
    phrase: { en: 'One more coffee.', ar: 'فنجان آخر.' },
    context: {
      en: 'Soft light, an open view and nowhere you need to be.',
      ar: 'ضوء ناعم وإطلالة مفتوحة ولا موعد يفرض نفسه.',
    },
    image:
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'little-moments',
    phase: 'day',
    title: { en: 'Little moments', ar: 'لحظات صغيرة' },
    phrase: { en: 'The ones you remember.', ar: 'هي التي تبقى.' },
    context: {
      en: 'Easy family spaces for the unplanned parts of the day.',
      ar: 'مساحات عائلية مريحة للحظات اليوم غير المخطط لها.',
    },
    image:
      'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'late-breakfast',
    phase: 'day',
    title: { en: 'Late breakfast', ar: 'إفطار متأخر' },
    phrase: { en: 'Because nobody set an alarm.', ar: 'لأن لا أحد ضبط المنبّه.' },
    context: {
      en: 'A generous table, a practical kitchen and time to linger.',
      ar: 'طاولة رحبة ومطبخ عملي ووقت يسمح بالبقاء أكثر.',
    },
    image:
      'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'good-food',
    phase: 'day',
    title: { en: 'Good food', ar: 'طعام طيب' },
    phrase: { en: 'Pass the plate.', ar: 'مرّر الطبق.' },
    context: {
      en: 'Homes that make shared meals feel like part of the trip.',
      ar: 'بيوت تجعل الوجبات المشتركة جزءاً أصيلاً من الرحلة.',
    },
    image:
      'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'time-without-planning',
    phase: 'sunset',
    title: { en: 'Time without planning', ar: 'وقت بلا خطط' },
    phrase: { en: 'Let the day decide.', ar: 'دع اليوم يختار.' },
    context: {
      en: 'The right setting for a day that does not need an itinerary.',
      ar: 'المكان المناسب ليوم لا يحتاج إلى برنامج.',
    },
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'after-sunset',
    phase: 'evening',
    title: { en: 'After sunset', ar: 'بعد الغروب' },
    phrase: { en: 'Stay a little longer.', ar: 'ابقَ قليلاً بعد.' },
    context: {
      en: 'Warm outdoor light and a place for the evening to unfold.',
      ar: 'إضاءة خارجية دافئة ومساحة يكتمل فيها المساء.',
    },
    image:
      'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'their-room',
    phase: 'evening',
    title: { en: 'Their room', ar: 'غرفتهم' },
    phrase: { en: 'A corner of their own.', ar: 'ركن يخصهم.' },
    context: {
      en: 'Family homes where younger guests have room to settle in.',
      ar: 'بيوت عائلية يجد فيها الصغار مساحة مريحة تخصهم.',
    },
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'soft-sheets',
    phase: 'night',
    title: { en: 'Soft sheets', ar: 'أغطية ناعمة' },
    phrase: { en: 'Sleep came easily.', ar: 'جاء النوم بسهولة.' },
    context: {
      en: 'Quiet bedrooms and the details that help everyone switch off.',
      ar: 'غرف هادئة وتفاصيل تساعد الجميع على الاسترخاء.',
    },
    image:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=86',
  },
  {
    slug: 'stars-and-silence',
    phase: 'night',
    title: { en: 'Stars and silence', ar: 'نجوم وسكون' },
    phrase: { en: 'Nothing else needed.', ar: 'لا نحتاج شيئاً آخر.' },
    context: {
      en: 'Night air, low light and enough distance from the noise.',
      ar: 'هواء الليل وضوء خافت ومسافة كافية عن الضوضاء.',
    },
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=86',
  },
]

export function getMomentBySlug(slug: string | undefined) {
  return moments.find((moment) => moment.slug === slug)
}
