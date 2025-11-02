import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Leo Finance - Bitcoin-Backed Lending Circles',
  description: 'Decentralized lending circles (ROSCA) on Mezo with MUSD stablecoin integration',
  keywords: ['DeFi', 'Lending Circles', 'Bitcoin', 'Mezo', 'MUSD', 'ROSCA'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
