'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export function Localized({
  en,
  ar,
  className,
}: {
  en: string
  ar: string
  className?: string
}) {
  const { language, isRTL } = useLanguage()

  return (
    <span className={className} lang={language} dir={isRTL ? 'rtl' : 'ltr'}>
      {language === 'ar' ? ar : en}
    </span>
  )
}
