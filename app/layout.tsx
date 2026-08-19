import './globals.css'
import type { Metadata } from 'next'
import {
  Montserrat,
  Noto_Naskh_Arabic,
  Playfair_Display,
} from 'next/font/google'
import { LanguageProvider } from '@/contexts/LanguageContext'

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
const serif = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})
const arabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Little Hut Vacations | Find your Moment',
    template: '%s | Little Hut Vacations',
  },
  description:
    'Discover a distinctive Little Hut Moment, see the home\'s truth state, and move from transparent availability to one accountable Stayza record.',
  keywords:
    'Little Hut Vacations, Ain Sokhna, Azha, direct booking, Salty Life Villa, Stayza',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} ${arabic.variable}`}>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
