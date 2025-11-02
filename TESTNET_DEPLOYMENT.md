# 🚀 Leo Finance - Mezo Testnet Deployment Guide

## 📋 **Pre-Deployment Checklist**

Before deploying, ensure you have:

- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git repository cloned
- [ ] Ethereum wallet (MetaMask, etc.)
- [ ] Mezo Testnet BTC for gas fees
- [ ] WalletConnect Project ID (for frontend)

---

## 🔧 **Step 1: Get Mezo Testnet BTC**

### **Option A: Using Mezo Faucet (Recommended)**

1. **Visit Mezo Discord:**
   - Join: https://discord.com/invite/mezo
   - Navigate to the testnet channel
   - Request testnet BTC from faucet bot

2. **Add Mezo Testnet to MetaMask:**
   ```
   Network Name: Mezo Testnet
   RPC URL: https://rpc.test.mezo.org
   Chain ID: 31611
   Currency Symbol: BTC
   Block Explorer: https://explorer.test.mezo.org
   ```

3. **Verify Balance:**
   - Check your wallet in MetaMask
   - Or visit: https://explorer.test.mezo.org/address/YOUR_ADDRESS

### **Option B: Bridge from Bitcoin Testnet**

1. Get Bitcoin testnet coins from:
   - https://testnet-faucet.com/btc-testnet/
   - https://coinfaucet.eu/en/btc-testnet/

2. Bridge to Mezo using official bridge (check Mezo docs)

### **How Much BTC Do You Need?**

**Minimum:** 0.01 BTC (~$500 at current prices, but free on testnet)
- Contract deployments: ~0.005 BTC
- Testing transactions: ~0.002 BTC
- Buffer for errors: ~0.003 BTC

---

## 💻 **Step 2: Backend Setup & Deployment**

### **2.1 Clone and Install**

```bash
# Navigate to project
cd /home/user/leo

# Install dependencies
npm install

# Verify installation
npx hardhat --version
```

**Expected Output:**
```
Hardhat version 2.19.0
```

### **2.2 Configure Environment**

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

**Update `.env` with:**

```bash
# YOUR WALLET PRIVATE KEY (DO NOT SHARE!)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Mezo Testnet RPC (default is fine)
MEZO_TESTNET_RPC_URL=https://rpc.test.mezo.org
MEZO_TESTNET_CHAIN_ID=31611

# Official Mezo MUSD Testnet Address
MUSD_CONTRACT_ADDRESS_TESTNET=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

**⚠️ How to Get Your Private Key:**

**MetaMask:**
1. Click account icon → Account Details
2. Click "Export Private Key"
3. Enter password
4. Copy private key (starts with 0x)

**⚠️ SECURITY WARNING:**
- NEVER share your private key
- NEVER commit .env to Git (.gitignore already configured)
- Use a TEST wallet, not your main wallet

### **2.3 Compile Contracts**

```bash
# Compile all smart contracts
npm run compile
```

**Expected Output:**
```
Compiled 6 Solidity files successfully
✓ CircleFactory
✓ TrustScore
✓ InsurancePool
✓ YieldManager
✓ MUSDIntegration
✓ MockMUSD
```

**If Compilation Fails:**

Check Solidity compiler version:
```bash
# Should see evmVersion: "london" in hardhat.config.js
cat hardhat.config.js | grep evmVersion
```

### **2.4 Run Tests (Optional but Recommended)**

```bash
# Run all tests
npm test

# Or run specific test suite
npx hardhat test test/TrustScore.test.js
npx hardhat test test/CircleFactory.test.js
```

**Expected Output:**
```
  TrustScore
    ✓ Should set the correct owner
    ✓ Should calculate trust score correctly
    ... (25+ tests)

  CircleFactory
    ✓ Should create a circle successfully
    ✓ Should process monthly payouts
    ... (20+ tests)

  80 passing (15s)
```

### **2.5 Deploy to Mezo Testnet**

```bash
# Deploy all contracts
npm run deploy:testnet

# Or use hardhat directly
npx hardhat run scripts/deploy.js --network mezoTestnet
```

**⏱️ Expected Duration:** 2-5 minutes

**Expected Output:**
```
🚀 Starting Leo Finance deployment to Mezo Testnet...

Deploying contracts with account: 0xYourAddress
Account balance: 0.01 BTC

📝 Deploying MockMUSD...
✅ MockMUSD deployed to: 0xabc123...

📝 Deploying TrustScore...
✅ TrustScore deployed to: 0xdef456...

📝 Deploying InsurancePool...
✅ InsurancePool deployed to: 0xghi789...

📝 Deploying YieldManager...
✅ YieldManager deployed to: 0xjkl012...

📝 Deploying CircleFactory...
✅ CircleFactory deployed to: 0xmno345...

📝 Deploying MUSDIntegration...
✅ MUSDIntegration deployed to: 0xpqr678...

🔐 Setting up contract authorizations...
  - Authorizing CircleFactory in TrustScore...
  - Authorizing CircleFactory in InsurancePool...
  - Authorizing CircleFactory in YieldManager...
✅ Authorizations complete

📋 Deployment Summary:
═══════════════════════════════════════════════
Network: mezoTestnet
Deployer: 0xYourAddress

Contract Addresses:
  MockMUSD: 0xabc123...
  TrustScore: 0xdef456...
  InsurancePool: 0xghi789...
  YieldManager: 0xjkl012...
  CircleFactory: 0xmno345...
  MUSDIntegration: 0xpqr678...
═══════════════════════════════════════════════

💾 Deployment info saved to: deployments/mezoTestnet-1730544000000.json
💾 Latest deployment saved to: deployments/mezoTestnet-latest.json
💾 Frontend config saved to: frontend/lib/contracts.ts

✨ Deployment complete!
```

**🎯 IMPORTANT:** Save all contract addresses! You'll need them for the frontend.

### **2.6 Verify Deployment**

```bash
# Check deployment files
cat deployments/mezoTestnet-latest.json

# View on Mezo Explorer
# Visit: https://explorer.test.mezo.org/address/YOUR_CONTRACT_ADDRESS
```

**What to Check:**
- ✅ All 6 contracts deployed
- ✅ Transactions confirmed
- ✅ Contract addresses saved
- ✅ No error messages

### **2.7 Seed Demo Data (Optional)**

```bash
# Create demo circles and users
npx hardhat run scripts/seed.js --network mezoTestnet
```

**Expected Output:**
```
🌱 Seeding Leo Finance with demo data...

📋 Using deployment from: 2025-11-02T12:00:00.000Z
Network: mezoTestnet

💰 Distributing MUSD to demo users...
  ✅ Sent 10000 MUSD to User 1: 0x123...
  ✅ Sent 10000 MUSD to User 2: 0x456...
  ✅ Sent 10000 MUSD to User 3: 0x789...
  ✅ Sent 10000 MUSD to User 4: 0xabc...
  ✅ Sent 10000 MUSD to User 5: 0xdef...

📊 Building trust scores for demo users...
  - Building User 1 to Silver tier...
    Score: 300 (Silver)
  - Building User 2 to Gold tier...
    Score: 600 (Gold)
  - Building User 3 to Platinum tier...
    Score: 800 (Platinum)

🔵 Creating demo circles...

  📍 Circle 1: Newcomer ($100/month)
    ✅ Created with 3 members

  📍 Circle 2: Silver ($300/month)
    ✅ Created with 2 members

  📍 Circle 3: Gold ($1000/month)
    ✅ Created with 1 member

💸 Making initial contributions to Circle 1...
  ✅ Circle 1 now full (5/5 members)
  📅 Month 1 contributions:
    ✅ User 1 contributed
    ✅ User 2 contributed
    ✅ User 3 contributed

✨ Seeding complete!

📊 Summary:
  - 5 demo users created with 10,000 MUSD each
  - Trust scores built for 3 users (Silver, Gold, Platinum)
  - 3 demo circles created (Newcomer, Silver, Gold)
  - Circle 1 has 3/5 contributions for Month 1

🎯 Ready for frontend testing!
```

---

## 🎨 **Step 3: Frontend Setup**

### **3.1 Install Frontend Dependencies**

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install
```

**Expected Output:**
```
added 234 packages, and audited 235 packages in 45s
```

### **3.2 Get WalletConnect Project ID**

1. **Visit WalletConnect Cloud:**
   - Go to: https://cloud.walletconnect.com

2. **Sign Up/Login:**
   - Create account or sign in

3. **Create New Project:**
   - Click "New Project"
   - Name: "Leo Finance"
   - Click "Create"

4. **Copy Project ID:**
   - You'll see a Project ID like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - Copy this!

### **3.3 Configure Frontend Environment**

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

**Update `.env.local` with:**

```bash
# Mezo Testnet Configuration
NEXT_PUBLIC_MEZO_TESTNET_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_MEZO_TESTNET_CHAIN_ID=31611

# WalletConnect Project ID (from Step 3.2)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Official MUSD Testnet Address
NEXT_PUBLIC_MUSD_ADDRESS_TESTNET=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503

# Your deployed contract addresses (auto-populated by deployment script)
# Check frontend/lib/contracts.ts - should already be updated!
```

### **3.4 Verify Contract Addresses**

```bash
# Check that deployment script updated contracts.ts
cat lib/contracts.ts
```

**Should show:**
```typescript
export const CONTRACTS = {
  MUSD: "0xabc123...",  // Your MockMUSD address
  TrustScore: "0xdef456...",
  InsurancePool: "0xghi789...",
  YieldManager: "0xjkl012...",
  CircleFactory: "0xmno345...",
  MUSDIntegration: "0xpqr678...",
} as const;
```

### **3.5 Run Development Server**

```bash
# Start Next.js dev server
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- info Loaded env from /home/user/leo/frontend/.env.local
- event compiled client and server successfully in 2.5s
```

### **3.6 Open in Browser**

1. Open browser: http://localhost:3000
2. You should see Leo Finance landing page
3. Click "Connect Wallet" in header

---

## 🧪 **Step 4: Test the Application**

### **4.1 Connect Wallet**

1. **Click "Connect Wallet" button**
2. **Select wallet type:**
   - MetaMask (EVM wallet)
   - Unisat (Bitcoin wallet) - if installed
   - OKX Wallet (Bitcoin wallet) - if installed
   - Xverse (Bitcoin wallet) - if installed

3. **Switch to Mezo Testnet:**
   - MetaMask will prompt to add Mezo Testnet
   - Approve the network addition
   - Switch to Mezo Testnet network

4. **Verify connection:**
   - Should see your address in header
   - Should see BTC balance

### **4.2 Test MUSD Balance**

```bash
# From backend directory, check MUSD balance
npx hardhat console --network mezoTestnet
```

In Hardhat console:
```javascript
const MUSD = await ethers.getContractAt("MockMUSD", "0xYourMUSDAddress")
const balance = await MUSD.balanceOf("0xYourWalletAddress")
console.log("MUSD Balance:", ethers.formatEther(balance))
```

**Or use faucet function:**
```javascript
const MUSD = await ethers.getContractAt("MockMUSD", "0xYourMUSDAddress")
await MUSD.faucet() // Gets 10,000 MUSD
console.log("Faucet claimed!")
```

### **4.3 Test Creating a Circle**

**Via Frontend (Coming Soon - needs additional pages):**
1. Navigate to /circles/create
2. Fill in circle details
3. Submit transaction

**Via Hardhat Console:**
```javascript
const CircleFactory = await ethers.getContractAt("CircleFactory", "0xYourCircleFactoryAddress")

// Create a newcomer circle
const tx = await CircleFactory.createCircle(
  ethers.parseEther("100"),  // $100 contribution
  6,                          // 6 months
  5,                          // 5 members
  0                          // No trust score requirement
)
await tx.wait()
console.log("Circle created!")
```

### **4.4 Test Trust Score**

```javascript
const TrustScore = await ethers.getContractAt("TrustScore", "0xYourTrustScoreAddress")

// Check your trust score
const score = await TrustScore.getTrustScore("0xYourAddress")
console.log("Your trust score:", score.toString())

// Check your tier
const tier = await TrustScore.getTrustTier("0xYourAddress")
console.log("Your tier:", tier) // 0=Newcomer, 1=Silver, 2=Gold, 3=Platinum
```

### **4.5 Verify on Explorer**

1. **Visit Mezo Testnet Explorer:**
   https://explorer.test.mezo.org

2. **Search for your contract addresses**

3. **Check transactions:**
   - Deployment transactions
   - Circle creation
   - MUSD transfers

4. **Verify contract code (optional):**
   - On explorer, go to contract address
   - Click "Verify & Publish"
   - Upload source code and compiler settings

---

## 📊 **Step 5: Monitoring & Verification**

### **5.1 Check All Deployments**

```bash
# View all deployed contracts
cat deployments/mezoTestnet-latest.json | jq
```

### **5.2 Test Each Contract Function**

**TrustScore:**
```bash
npx hardhat console --network mezoTestnet
```

```javascript
const TrustScore = await ethers.getContractAt("TrustScore", "0xYourAddress")

// View constants
console.log("Silver threshold:", await TrustScore.SILVER_THRESHOLD())
console.log("Gold threshold:", await TrustScore.GOLD_THRESHOLD())
console.log("Platinum threshold:", await TrustScore.PLATINUM_THRESHOLD())

// Get user metrics
const [owner] = await ethers.getSigners()
const metrics = await TrustScore.getUserTrustMetrics(owner.address)
console.log("Trust metrics:", metrics)
```

**CircleFactory:**
```javascript
const CircleFactory = await ethers.getContractAt("CircleFactory", "0xYourAddress")

// View circles
const totalCircles = await CircleFactory.getTotalCircles()
console.log("Total circles:", totalCircles.toString())

// Get circle details
if (totalCircles > 0) {
  const circle = await CircleFactory.getCircleDetails(0)
  console.log("Circle 0:", circle)
}
```

**InsurancePool:**
```javascript
const InsurancePool = await ethers.getContractAt("InsurancePool", "0xYourAddress")

// Check default insurance percentage
const percent = await InsurancePool.defaultInsurancePercent()
console.log("Insurance percent:", percent.toString(), "%")
```

**YieldManager:**
```javascript
const YieldManager = await ethers.getContractAt("YieldManager", "0xYourAddress")

// Check APY
const apy = await YieldManager.getCurrentAPY()
console.log("Current APY:", apy.toString(), "basis points") // 500 = 5%

// Check strategy count
const count = await YieldManager.strategyCount()
console.log("Strategies:", count.toString())
```

### **5.3 View Deployment Summary**

```bash
# Create a summary of all deployments
echo "=== Leo Finance Testnet Deployment ==="
echo ""
echo "Network: Mezo Testnet (Chain ID: 31611)"
echo "Explorer: https://explorer.test.mezo.org"
echo ""
echo "Deployed Contracts:"
cat deployments/mezoTestnet-latest.json | jq -r '.contracts | to_entries[] | "  \(.key): \(.value)"'
```

---

## ✅ **Step 6: Deployment Checklist**

### **Backend Deployment**
- [ ] Got Mezo testnet BTC
- [ ] Configured .env with private key
- [ ] Installed npm dependencies
- [ ] Compiled contracts successfully
- [ ] Ran tests (80+ passing)
- [ ] Deployed all 6 contracts
- [ ] Verified authorizations set up
- [ ] Saved contract addresses
- [ ] (Optional) Seeded demo data
- [ ] Verified on Mezo Explorer

### **Frontend Deployment**
- [ ] Installed frontend dependencies
- [ ] Got WalletConnect Project ID
- [ ] Configured .env.local
- [ ] Verified contract addresses in contracts.ts
- [ ] Started dev server successfully
- [ ] Connected wallet to Mezo Testnet
- [ ] Verified MUSD balance
- [ ] Tested contract interactions

---

## 🐛 **Troubleshooting**

### **Problem: "Insufficient funds for gas"**

**Solution:**
```bash
# Check your balance
npx hardhat console --network mezoTestnet
```
```javascript
const [signer] = await ethers.getSigners()
const balance = await ethers.provider.getBalance(signer.address)
console.log("Balance:", ethers.formatEther(balance), "BTC")
```

If balance is low:
- Request more from Mezo Discord faucet
- Or bridge more from Bitcoin testnet

### **Problem: "Network error"**

**Solution:**
```bash
# Test RPC connection
curl -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Should return latest block number.

### **Problem: "Contract compilation failed"**

**Solution:**
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile

# Check Solidity version
cat hardhat.config.js | grep "version:"
# Should be 0.8.20
```

### **Problem: "Transaction reverted"**

**Common causes:**
1. Insufficient MUSD balance
2. Not enough insurance staked
3. Circle already full
4. Below minimum trust score

**Debug:**
```javascript
// Check MUSD allowance
const MUSD = await ethers.getContractAt("MockMUSD", "0xYourMUSDAddress")
const allowance = await MUSD.allowance(
  "0xYourAddress",
  "0xCircleFactoryAddress"
)
console.log("Allowance:", ethers.formatEther(allowance))

// If too low, approve more
await MUSD.approve("0xCircleFactoryAddress", ethers.parseEther("100000"))
```

### **Problem: "Frontend won't start"**

**Solution:**
```bash
cd frontend

# Clear cache
rm -rf .next node_modules package-lock.json

# Reinstall
npm install

# Restart
npm run dev
```

### **Problem: "Wallet won't connect"**

**Solutions:**
1. Check MetaMask has Mezo Testnet added
2. Verify WalletConnect Project ID is correct
3. Try different wallet (MetaMask vs Unisat)
4. Clear browser cache
5. Restart browser

---

## 📈 **Next Steps After Deployment**

### **Immediate (Today)**
1. ✅ Deploy to testnet
2. ✅ Verify all contracts
3. ✅ Test basic functions
4. [ ] Create demo video
5. [ ] Share testnet link

### **This Week**
1. [ ] Add more frontend pages
   - `/dashboard` - User dashboard
   - `/circles/[id]` - Circle details
   - `/profile` - Trust score page
   - `/collateral` - BTC collateral management

2. [ ] Test all user flows
   - Create circle
   - Join circle
   - Make contribution
   - Receive payout

3. [ ] Gather feedback from testers

### **Before Mainnet**
1. [ ] Complete security audit
2. [ ] Stress test with multiple users
3. [ ] Fix any bugs found
4. [ ] Get mainnet BTC
5. [ ] Deploy to mainnet (Chain ID: 31612)

---

## 🎬 **Creating Demo Video**

### **Script Outline:**

1. **Introduction (30s)**
   - "Leo Finance: Bitcoin-backed lending circles"
   - "Built on Mezo with MUSD integration"

2. **Problem (30s)**
   - 2B+ underbanked globally
   - Can't access traditional finance
   - Bitcoin holders can't use their equity

3. **Solution (1min)**
   - Deposit BTC → Mint MUSD at 1%
   - Join lending circles
   - Build trust score (0-1000)
   - Automatic insurance & yield

4. **Demo (2min)**
   - Connect wallet
   - Show MUSD balance
   - Create a circle
   - Show trust score
   - Join existing circle

5. **Technology (1min)**
   - 6 smart contracts
   - 90%+ test coverage
   - Mezo Passport integration
   - Bitcoin & EVM wallets

6. **Impact (30s)**
   - Financial inclusion
   - Proven ROSCA model
   - Bitcoin circular economy

**Total: ~5 minutes**

---

## 📞 **Support & Resources**

### **Documentation**
- Main README: `/README.md`
- Architecture: `/docs/ARCHITECTURE.md`
- This guide: `/TESTNET_DEPLOYMENT.md`
- Updates: `/MEZO_UPDATES.md`

### **Mezo Resources**
- Docs: https://docs.mezo.org
- Discord: https://discord.com/invite/mezo
- Explorer: https://explorer.test.mezo.org

### **Getting Help**
1. Check documentation first
2. Review error messages carefully
3. Test with Hardhat console
4. Join Mezo Discord #developers channel
5. Check contract on explorer

---

## 🎉 **Success Criteria**

Your deployment is **successful** when:

✅ All 6 contracts deployed
✅ All transactions confirmed
✅ Contracts verified on explorer
✅ Frontend connects to contracts
✅ Wallet connects to Mezo Testnet
✅ Can view MUSD balance
✅ Can interact with contracts
✅ Demo data loads correctly

---

**Congratulations!** 🎊

You've successfully deployed Leo Finance to Mezo Testnet!

**Next:** Test thoroughly, gather feedback, and prepare for mainnet launch!

---

**Last Updated:** November 2, 2025
**Network:** Mezo Testnet (Chain ID: 31611)
**Status:** ✅ READY TO DEPLOY
