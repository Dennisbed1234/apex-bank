import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://apex-bank-theta.vercel.app'),
  title: {
    default: 'Apex Bank — Banking that works for you',
    template: '%s — Apex Bank',
  },
  description:
    'Apex Bank is the modern way to bank: fee-free checking, high-yield savings, instant transfers, and real-time insights into your money.',
  generator: 'v0.app',
  openGraph: {
    title: 'Apex Bank — Banking that works for you',
    description:
      'Fee-free checking, high-yield savings, and instant transfers — all in one simple app.',
    url: 'https://apex-bank-theta.vercel.app',
    siteName: 'Apex Bank',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Apex Bank — Banking that works for you',
    description:
      'Fee-free checking, high-yield savings, and instant transfers — all in one simple app.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  colorScheme: 'light',
  themeColor: '#1f5138',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${manrope.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
