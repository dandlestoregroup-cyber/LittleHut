import './globals.css'
import type { Metadata } from 'next/metadata'

export const metadata: Metadata = {
  title: 'Little Hut Vacations | Here it is again',
  description: 'A few days in Ain Sokhna where nobody is managing the moment and ordinary things feel good again.',
  metadataBase: new URL('https://little-hut-stayza-direct-v2.vercel.app'),
  openGraph: {
    title: 'Little Hut Vacations | Here it is again',
    description: 'Tell us when you want it back.',
    url: 'https://little-hut-stayza-direct-v2.vercel.app',
    siteName: 'Little Hut Vacations',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
