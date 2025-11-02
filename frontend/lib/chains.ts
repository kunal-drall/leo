import { Chain } from 'viem'

// Official Mezo Testnet Configuration
export const mezoTestnet = {
  id: 31611, // Official Mezo Testnet Chain ID
  name: 'Mezo Testnet',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.test.mezo.org'] },
    public: { http: ['https://rpc.test.mezo.org'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.test.mezo.org' },
  },
  testnet: true,
} as const satisfies Chain

// Official Mezo Mainnet Configuration
export const mezoMainnet = {
  id: 31612, // Official Mezo Mainnet Chain ID
  name: 'Mezo',
  nativeCurrency: { name: 'Bitcoin', symbol: 'BTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-http.mezo.boar.network'] },
    public: { http: ['https://rpc-http.mezo.boar.network'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' },
  },
  testnet: false,
} as const satisfies Chain
