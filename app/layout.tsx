import type { Metadata } from 'next'
import { Fredoka, Space_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-label',
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
    <html lang="en" className={`${fredoka.variable} ${spaceMono.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
