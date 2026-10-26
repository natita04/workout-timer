import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Workout Timer',
  description: 'Build interval workouts with warm-up, main sets and wind-down',
  appleWebApp: { capable: true, title: 'Workout', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets content extend under the notch; padding is restored with the safe-area utilities.
  viewportFit: 'cover',
  themeColor: '#f9fafb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
