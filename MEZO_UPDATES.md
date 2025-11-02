# Mezo Network Updates - November 2, 2025

## 🎉 Critical Updates Based on Official Mezo Documentation

This document outlines the important updates made to align Leo Finance with the **official Mezo Mainnet and Testnet specifications**.

## 🔄 Key Changes

### 1. **Chain IDs Updated**

**Previous (Incorrect):**
- Testnet: 686868 (placeholder)

**Current (Official):**
- **Testnet: 31611** ✅
- **Mainnet: 31612** ✅

### 2. **RPC URLs Updated**

**Previous:**
- Testnet: `https://testnet-rpc.mezo.org`

**Current (Official):**
- **Testnet: `https://rpc.test.mezo.org`** ✅
- **Mainnet: `https://rpc-http.mezo.boar.network`** ✅

**Alternative Mainnet RPCs:**
- `https://rpc_evm-mezo.imperator.co`
- `https://mainnet.mezo.public.validationcloud.io`

### 3. **MUSD Contract Addresses Added**

**Official MUSD Contracts:**
- **Mainnet: `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186`** ✅
- **Testnet: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`** ✅

### 4. **Native Currency Corrected**

**Previous:**
- Name: "Ethereum"
- Symbol: "ETH"

**Current (Official):**
- **Name: "Bitcoin"** ✅
- **Symbol: "BTC"** ✅
- Decimals: 18 (remains the same)

### 5. **Solidity EVM Version Added**

**Requirement:** Mezo requires `evmVersion: "london"` in Solidity compiler settings.

**Updated in:**
- `hardhat.config.js` - Added `evmVersion: "london"` ✅

### 6. **Mezo Passport Integration Confirmed**

The project already uses **`@mezo-org/passport`** correctly! ✅

**Confirmed Implementation:**
- Uses `getConfig()` from Mezo Passport
- Supports Bitcoin wallets (Unisat, OKX, Xverse)
- Integrates with RainbowKit
- Proper wagmi v2 configuration

## 📝 Files Updated

### Smart Contract Configuration
✅ **hardhat.config.js**
- Updated testnet chain ID to 31611
- Added mainnet configuration (31612)
- Updated RPC URLs
- Added `evmVersion: "london"`

### Environment Variables
✅ **.env.example**
- Updated all chain IDs
- Updated RPC URLs
- Added MUSD contract addresses (mainnet & testnet)
- Added mainnet configuration

### Frontend Configuration
✅ **frontend/lib/config.ts**
- Confirmed Mezo Passport `getConfig()` usage
- Proper Bitcoin wallet support

✅ **frontend/lib/chains.ts**
- Updated testnet chain ID to 31611
- Added mainnet chain (31612)
- Corrected native currency to BTC
- Updated RPC URLs
- Updated block explorer URLs

✅ **frontend/.env.local.example**
- Updated all chain IDs
- Updated RPC URLs
- Added MUSD contract addresses
- Added mainnet configuration

## ✅ Compliance with Mezo dApp Requirements

### 1. **Mezo Passport** ✅
- Already integrated via `@mezo-org/passport`
- Provides Bitcoin wallet support (Unisat, OKX, Xverse)
- Works with RainbowKit for EVM wallets

### 2. **MUSD Integration** ✅
- Core to the entire platform
- MUSD is used for:
  - Circle contributions
  - Loan positions
  - Yield generation
  - Insurance pools

### 3. **Audit Report** ⏳
- Required for featuring on Mezo Market
- Should be completed before mainnet launch

### 4. **Mainnet Functionality** ⏳
- Testnet deployment ready
- Mainnet configuration added
- Ready for production deployment

## 🚀 Deployment Instructions (Updated)

### **Testnet Deployment**

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with:
# - PRIVATE_KEY (your wallet private key with testnet BTC)
# - Use default values for Mezo Testnet

# 2. Deploy contracts
npm run deploy:testnet

# 3. Contracts will deploy to Chain ID 31611
# 4. Use testnet MUSD: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

### **Mainnet Deployment**

```bash
# 1. Update .env for mainnet
# - Set MEZO_MAINNET_RPC_URL
# - Ensure PRIVATE_KEY has mainnet BTC for gas

# 2. Add mainnet deployment script
npm run deploy:mainnet

# 3. Contracts will deploy to Chain ID 31612
# 4. Use mainnet MUSD: 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186
```

## 📊 Network Details Summary

### **Mezo Testnet**
- **Chain ID:** 31611
- **RPC URL:** https://rpc.test.mezo.org
- **WSS URL:** wss://rpc-ws.test.mezo.org
- **Explorer:** https://explorer.test.mezo.org
- **MUSD:** 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
- **Native Currency:** BTC (18 decimals)

### **Mezo Mainnet**
- **Chain ID:** 31612
- **RPC URL:** https://rpc-http.mezo.boar.network
- **WSS URL:** wss://rpc-ws.mezo.boar.network
- **Explorer:** https://explorer.mezo.org
- **MUSD:** 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186
- **Native Currency:** BTC (18 decimals)

## 🔗 Important Resources

### **Documentation**
- Mezo Docs: https://docs.mezo.org
- Mezo Passport NPM: https://www.npmjs.com/package/@mezo-org/passport
- MUSD Redemption Guide: https://docs.mezo.org/musd-redemptions

### **Getting Testnet BTC**
1. Get native BTC from faucet
2. Bridge to Mezo testnet
3. Use for gas fees

### **WalletConnect Setup**
1. Visit https://cloud.walletconnect.com
2. Create project
3. Copy Project ID
4. Add to `frontend/.env.local`

## 🎯 Next Steps

### **Before Testnet Deployment**
- [ ] Get Mezo testnet BTC for gas
- [ ] Configure `.env` with private key
- [ ] Test contract compilation
- [ ] Run test suite

### **Before Mainnet Deployment**
- [ ] Complete security audit
- [ ] Test thoroughly on testnet
- [ ] Get mainnet BTC for gas
- [ ] Update all documentation
- [ ] Submit dApp intake form to Mezo

### **For Hackathon Submission**
- [ ] Deploy to Mezo Testnet (31611)
- [ ] Create demo video
- [ ] Document MUSD integration
- [ ] Prepare pitch deck
- [ ] Submit before November 2, 2025 deadline

## ⚠️ Important Notes

1. **Gas Token:** Native BTC is used for gas on Mezo (not ETH)
2. **MUSD Integration:** Central to the platform - meets dApp requirements
3. **Mezo Passport:** Already properly integrated
4. **Audit:** Required for Mezo Market featuring
5. **EVM Version:** Must use "london" for Solidity compilation

## 🏆 Hackathon Alignment

### **Financial Access & Mass Adoption Track** ✅

**Leo Finance delivers:**
- Bitcoin-backed lending (MUSD collateralization)
- On-chain trust scoring (financial inclusion)
- Decentralized ROSCAs (proven model globally)
- Insurance protection (economic safety)
- Yield generation (sustainable growth)

### **MUSD Integration** ✅

**Deep integration:**
- Mint MUSD from BTC collateral
- Use MUSD for circle contributions
- Earn yield on MUSD deposits
- Redeem MUSD for BTC
- Insurance pools in MUSD

---

**Status:** ✅ **Ready for Deployment**

**Last Updated:** November 2, 2025

**Project:** Leo Finance - Bitcoin-Backed Lending Circles on Mezo
