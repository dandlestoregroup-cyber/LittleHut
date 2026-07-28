import './globals.css'
import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display } from 'next/font/google'

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })

export const metadata: Metadata = {
  title: {
    default: 'Little Hut Vacations | Direct stays in Ain Sokhna',
    template: '%s | Little Hut Vacations',
  },
  description:
    'Search real availability, see your complete quote, and request a Little Hut stay in Ain Sokhna directly through Stayza.',
  keywords:
    'Little Hut Vacations, Ain Sokhna, Azha, direct booking, Salty Life Villa, Stayza',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable}`}>
        {children}
      </body>
    </html>
  )
}
