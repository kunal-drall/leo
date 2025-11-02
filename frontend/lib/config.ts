import { getConfig } from '@mezo-org/passport'

// Note: Using Mezo Passport's getConfig instead of custom wagmi config
// This provides proper support for Bitcoin wallets (Unisat, OKX, Xverse)
// and EVM wallets through RainbowKit
export const config = getConfig({
  appName: 'Leo Finance',
  // Add custom Bitcoin wallet configuration here if needed
  // bitcoinWallets: [...]
})

// App Configuration
export const APP_CONFIG = {
  name: 'Leo Finance',
  description: 'Bitcoin-Backed Lending Circles on Mezo',
  url: 'https://leo-finance.vercel.app',
  icons: ['/logo.png'],
} as const

// Contract Configuration
export const TRUST_TIER_LIMITS = {
  NEWCOMER: 200n * 10n ** 18n,      // $200
  SILVER: 500n * 10n ** 18n,        // $500
  GOLD: 2000n * 10n ** 18n,         // $2,000
  PLATINUM: BigInt(Number.MAX_SAFE_INTEGER), // Unlimited
} as const

export const TRUST_TIER_THRESHOLDS = {
  SILVER: 250,
  GOLD: 500,
  PLATINUM: 750,
} as const

export const CIRCLE_LIMITS = {
  MIN_CONTRIBUTION: 50n * 10n ** 18n,
  MIN_DURATION: 3,
  MAX_DURATION: 24,
  MIN_MEMBERS: 3,
  MAX_MEMBERS: 20,
} as const
