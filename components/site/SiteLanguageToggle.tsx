'use client'

import { Languages } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function SiteLanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const nextLanguage = language === 'en' ? 'ar' : 'en'

  return (
    <button
      className="language-toggle"
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={
        language === 'en'
          ? 'Switch the website to Arabic'
          : 'حوّل الموقع إلى الإنجليزية'
      }
    >
      <Languages aria-hidden="true" />
      <span>{language === 'en' ? 'العربية' : 'EN'}</span>
    </button>
  )
}
