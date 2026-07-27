import './globals.css'
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://little-hut-stayza-direct-v2.vercel.app'),
  title: {
    default: 'Little Hut Vacations | Here it is again',
    template: '%s | Little Hut Vacations',
  },
  description: 'A few days in Ain Sokhna where nobody is managing the moment and ordinary things feel good again.',
  openGraph: {
    title: 'Little Hut Vacations | Here it is again',
    description: 'Tell us when you want it back.',
    url: 'https://little-hut-stayza-direct-v2.vercel.app',
    siteName: 'Little Hut Vacations',
    type: 'website',
  },
  icons: { icon: '/favicon.svg' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f7efe6',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
