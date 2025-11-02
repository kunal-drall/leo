import { http, createConfig } from 'wagmi'
import { mezoTestnet } from './chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Mezo Testnet Chain Configuration
export const mezoTestnetChain = {
  id: 686868,
  name: 'Mezo Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MEZO_TESTNET_RPC_URL || 'https://testnet-rpc.mezo.org'] },
    public: { http: [process.env.NEXT_PUBLIC_MEZO_TESTNET_RPC_URL || 'https://testnet-rpc.mezo.org'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' },
  },
  testnet: true,
} as const

// Wagmi Configuration
export const config = createConfig({
  chains: [mezoTestnetChain] as any,
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    }),
  ],
  transports: {
    [mezoTestnetChain.id]: http(),
  },
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
