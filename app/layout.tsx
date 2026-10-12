import type { Metadata } from 'next'
import { fontBody, fontCairo, fontDisplay, fontGrotesk } from './fonts'
import './globals.css'

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
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontGrotesk.variable} ${fontCairo.variable}`}
    >
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}
