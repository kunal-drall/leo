import { Chain } from 'viem'

export const mezoTestnet = {
  id: 686868,
  name: 'Mezo Testnet',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.mezo.org'] },
    public: { http: ['https://testnet-rpc.mezo.org'] },
  },
  blockExplorers: {
    default: { name: 'Mezo Explorer', url: 'https://explorer.mezo.org' },
  },
  testnet: true,
} as const satisfies Chain
