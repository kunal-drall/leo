const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🌱 Seeding Leo Finance with demo data...\n");

  // Load latest deployment
  const deploymentsDir = path.join(__dirname, "../deployments");
  const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    console.error("❌ No deployment found. Please run deploy script first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(latestFile, "utf8"));
  console.log("📋 Using deployment from:", deployment.timestamp);
  console.log("Network:", deployment.network, "\n");

  const [owner, user1, user2, user3, user4, user5] = await hre.ethers.getSigners();

  // Get contract instances
  const musdToken = await hre.ethers.getContractAt("MockMUSD", deployment.contracts.MockMUSD);
  const circleFactory = await hre.ethers.getContractAt("CircleFactory", deployment.contracts.CircleFactory);
  const trustScore = await hre.ethers.getContractAt("TrustScore", deployment.contracts.TrustScore);
  const insurancePool = await hre.ethers.getContractAt("InsurancePool", deployment.contracts.InsurancePool);

  // 1. Distribute MUSD to demo users
  console.log("💰 Distributing MUSD to demo users...");
  const users = [user1, user2, user3, user4, user5];
  const amount = hre.ethers.parseEther("10000"); // 10,000 MUSD each

  for (let i = 0; i < users.length; i++) {
    await musdToken.transfer(users[i].address, amount);
    console.log(`  ✅ Sent ${hre.ethers.formatEther(amount)} MUSD to User ${i + 1}: ${users[i].address}`);
  }

  // 2. Build trust scores for some users
  console.log("\n📊 Building trust scores for demo users...");

  // User 1: Silver tier (score ~300)
  console.log("  - Building User 1 to Silver tier...");
  for (let i = 0; i < 5; i++) {
    await trustScore.updatePaymentRecord(user1.address, true);
  }
  await trustScore.recordCircleCompletion(user1.address, false);
  let score1 = await trustScore.getTrustScore(user1.address);
  console.log(`    Score: ${score1} (${await getTierName(trustScore, user1.address)})`);

  // User 2: Gold tier (score ~600)
  console.log("  - Building User 2 to Gold tier...");
  for (let i = 0; i < 10; i++) {
    await trustScore.updatePaymentRecord(user2.address, true);
  }
  await trustScore.recordCircleCompletion(user2.address, false);
  let score2 = await trustScore.getTrustScore(user2.address);
  console.log(`    Score: ${score2} (${await getTierName(trustScore, user2.address)})`);

  // User 3: Platinum tier (score ~800)
  console.log("  - Building User 3 to Platinum tier...");
  for (let i = 0; i < 15; i++) {
    await trustScore.updatePaymentRecord(user3.address, true);
  }
  for (let i = 0; i < 2; i++) {
    await trustScore.recordCircleCompletion(user3.address, false);
  }
  let score3 = await trustScore.getTrustScore(user3.address);
  console.log(`    Score: ${score3} (${await getTierName(trustScore, user3.address)})`);

  // 3. Create demo circles
  console.log("\n🔵 Creating demo circles...");

  // Approve CircleFactory and InsurancePool for all users
  const approvalAmount = hre.ethers.parseEther("100000");
  for (const user of users) {
    await musdToken.connect(user).approve(circleFactory.target, approvalAmount);
    await musdToken.connect(user).approve(insurancePool.target, approvalAmount);
  }

  // Circle 1: Newcomer circle - $100/month, 5 members, 6 months
  console.log("\n  📍 Circle 1: Newcomer ($100/month)");
  await circleFactory.connect(user1).createCircle(
    hre.ethers.parseEther("100"),
    6,
    5,
    0 // No trust score requirement
  );
  await circleFactory.connect(user2).joinCircle(0);
  await circleFactory.connect(user3).joinCircle(0);
  console.log("    ✅ Created with 3 members");

  // Circle 2: Silver circle - $300/month, 4 members, 12 months
  console.log("\n  📍 Circle 2: Silver ($300/month)");
  await circleFactory.connect(user2).createCircle(
    hre.ethers.parseEther("300"),
    12,
    4,
    250 // Silver tier required
  );
  await circleFactory.connect(user3).joinCircle(1);
  console.log("    ✅ Created with 2 members");

  // Circle 3: Gold circle - $1000/month, 3 members, 6 months
  console.log("\n  📍 Circle 3: Gold ($1000/month)");
  await circleFactory.connect(user3).createCircle(
    hre.ethers.parseEther("1000"),
    6,
    3,
    500 // Gold tier required
  );
  console.log("    ✅ Created with 1 member");

  // 4. Make some contributions to Circle 1
  console.log("\n💸 Making initial contributions to Circle 1...");

  // Need to fill the circle first
  await circleFactory.connect(user4).joinCircle(0);
  await circleFactory.connect(user5).joinCircle(0);
  console.log("  ✅ Circle 1 now full (5/5 members)");

  // Make first month contributions
  console.log("  📅 Month 1 contributions:");
  await circleFactory.connect(user1).makeContribution(0);
  console.log("    ✅ User 1 contributed");
  await circleFactory.connect(user2).makeContribution(0);
  console.log("    ✅ User 2 contributed");
  await circleFactory.connect(user3).makeContribution(0);
  console.log("    ✅ User 3 contributed");

  console.log("\n✨ Seeding complete!\n");
  console.log("📊 Summary:");
  console.log("  - 5 demo users created with 10,000 MUSD each");
  console.log("  - Trust scores built for 3 users (Silver, Gold, Platinum)");
  console.log("  - 3 demo circles created (Newcomer, Silver, Gold)");
  console.log("  - Circle 1 has 3/5 contributions for Month 1");
  console.log("\n🎯 Ready for frontend testing!\n");
}

async function getTierName(trustScore, address) {
  const tier = await trustScore.getTrustTier(address);
  const tiers = ["Newcomer", "Silver", "Gold", "Platinum"];
  return tiers[tier];
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
