'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

const footerCopy = {
  en: {
    promise: 'Verified Moments, transparent booking and accountable human support.',
    explore: 'Explore',
    moments: 'Find a Moment',
    homes: 'See homes',
    track: 'Track a stay',
    owners: 'Owners',
    submit: 'Submit a home',
    ownerStatus: 'Track your application',
    support: 'Need human help?',
    whatsapp: 'WhatsApp support',
    supportNote: 'Support only — booking and truth states stay on this website.',
    technology: 'Operating record by Stayza',
  },
  ar: {
    promise: 'لحظات موثّقة وحجز واضح ودعم بشري مسؤول.',
    explore: 'استكشف',
    moments: 'ابحث عن لحظة',
    homes: 'شاهد البيوت',
    track: 'تابع إقامتك',
    owners: 'المُلّاك',
    submit: 'قدّم بيتك',
    ownerStatus: 'تابع طلبك',
    support: 'تحتاج مساعدة بشرية؟',
    whatsapp: 'الدعم عبر واتساب',
    supportNote: 'للدعم فقط — الحجز وحالة التحقق يبقيان داخل الموقع.',
    technology: 'سجل التشغيل بواسطة Stayza',
  },
}

export function SiteFooter() {
  const { language } = useLanguage()
  const labels = footerCopy[language]

  return (
    <footer className="site-footer">
      <div className="site-shell footer-grid">
        <div>
          <Link className="brand brand-footer" href="/">
            <span className="brand-mark">⌂</span>
            <span>LITTLE HUT<small>VACATIONS</small></span>
          </Link>
          <p>{labels.promise}</p>
        </div>
        <div>
          <b>{labels.explore}</b>
          <Link href="/#moments">{labels.moments}</Link>
          <Link href="/stays">{labels.homes}</Link>
          <Link href="/track">{labels.track}</Link>
        </div>
        <div>
          <b>{labels.owners}</b>
          <Link href="/owners/apply">{labels.submit}</Link>
          <Link href="/owners/status">{labels.ownerStatus}</Link>
        </div>
        <div>
          <b>{labels.support}</b>
          <a href="tel:+201270228656">+20 127 022 8656</a>
          <a
            href="https://wa.me/201270228656?text=Hello%20Little%20Hut%20Vacations%2C%20I%20need%20support%20with%20an%20existing%20booking."
            target="_blank"
            rel="noreferrer"
          >
            {labels.whatsapp}
          </a>
          <small>{labels.supportNote}</small>
        </div>
      </div>
      <div className="site-shell footer-bottom">
        <span>© {new Date().getFullYear()} Little Hut Vacations</span>
        <span>{labels.technology}</span>
      </div>
    </footer>
  )
}
