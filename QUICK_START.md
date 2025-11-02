# ⚡ Leo Finance - Quick Start Guide

## 🚀 **Deploy to Testnet in 5 Minutes**

### **Prerequisites:**
- ✅ Mezo testnet BTC for gas
- ✅ Wallet with private key
- ✅ Node.js 18+ installed

---

## **Step 1: Backend (2 minutes)**

```bash
# Install & configure
cd /home/user/leo
npm install
cp .env.example .env

# Edit .env - add your PRIVATE_KEY
nano .env

# Deploy
npm run deploy:testnet
```

**Save the contract addresses shown!**

---

## **Step 2: Frontend (2 minutes)**

```bash
# Setup frontend
cd frontend
npm install
cp .env.local.example .env.local

# Edit .env.local - add WalletConnect ID
nano .env.local

# Run
npm run dev
```

**Visit:** http://localhost:3000

---

## **Step 3: Test (1 minute)**

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Switch to Mezo Testnet (Chain ID: 31611)
4. ✅ You're live!

---

## **Quick Commands**

```bash
# Get testnet MUSD (from Hardhat console)
npx hardhat console --network mezoTestnet
> const MUSD = await ethers.getContractAt("MockMUSD", "YOUR_ADDRESS")
> await MUSD.faucet()  # Gets 10,000 MUSD

# Check balance
> const balance = await MUSD.balanceOf("YOUR_WALLET")
> console.log(ethers.formatEther(balance))

# Create circle
> const Factory = await ethers.getContractAt("CircleFactory", "YOUR_ADDRESS")
> await Factory.createCircle(
    ethers.parseEther("100"), // $100
    6,  // 6 months
    5,  // 5 members
    0   // No trust score required
  )
```

---

## **Network Details**

**Mezo Testnet:**
- Chain ID: `31611`
- RPC: `https://rpc.test.mezo.org`
- Explorer: `https://explorer.test.mezo.org`
- Currency: BTC (18 decimals)

**Official MUSD:**
- Testnet: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
- Mainnet: `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186`

---

## **Get Testnet BTC**

1. Join Mezo Discord: https://discord.com/invite/mezo
2. Go to testnet channel
3. Request from faucet bot
4. Add Mezo Testnet to MetaMask (settings above)

---

## **Troubleshooting**

**Out of gas?**
→ Request more from Mezo Discord faucet

**Compilation fails?**
→ `npx hardhat clean && npx hardhat compile`

**Frontend won't start?**
→ `cd frontend && rm -rf .next && npm run dev`

**Wallet won't connect?**
→ Verify WalletConnect ID in `.env.local`

---

## **Full Documentation**

For detailed instructions, see:
- 📘 **TESTNET_DEPLOYMENT.md** - Complete deployment guide
- 📗 **README.md** - Project overview
- 📙 **ARCHITECTURE.md** - Technical details
- 📕 **MEZO_UPDATES.md** - Network specifications

---

## **Support**

- Discord: https://discord.com/invite/mezo
- Docs: https://docs.mezo.org
- Explorer: https://explorer.test.mezo.org

---

**Status:** ✅ Ready to deploy!
**Time to deploy:** ~5 minutes
**Difficulty:** Easy

🦁 **Let's build!**
