import type { Metadata } from 'next'
import { Fredoka, Space_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const fredokaOne = Fredoka({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-body-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PUA ICPC — Crack the Code',
  description: 'The fiercest algorithmic competitive programming community at Pharos University in Alexandria.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${fredokaOne.variable} ${spaceMono.variable} antialiased`}
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}
