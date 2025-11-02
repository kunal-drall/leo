const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Leo Finance deployment to Mezo Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy MockMUSD (for testnet only - in production use real MUSD)
  console.log("📝 Deploying MockMUSD...");
  const MockMUSD = await hre.ethers.getContractFactory("MockMUSD");
  const musdToken = await MockMUSD.deploy();
  await musdToken.waitForDeployment();
  const musdAddress = await musdToken.getAddress();
  console.log("✅ MockMUSD deployed to:", musdAddress);

  // Deploy TrustScore
  console.log("\n📝 Deploying TrustScore...");
  const TrustScore = await hre.ethers.getContractFactory("TrustScore");
  const trustScore = await TrustScore.deploy();
  await trustScore.waitForDeployment();
  const trustScoreAddress = await trustScore.getAddress();
  console.log("✅ TrustScore deployed to:", trustScoreAddress);

  // Deploy InsurancePool
  console.log("\n📝 Deploying InsurancePool...");
  const InsurancePool = await hre.ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(musdAddress);
  await insurancePool.waitForDeployment();
  const insurancePoolAddress = await insurancePool.getAddress();
  console.log("✅ InsurancePool deployed to:", insurancePoolAddress);

  // Deploy YieldManager
  console.log("\n📝 Deploying YieldManager...");
  const YieldManager = await hre.ethers.getContractFactory("YieldManager");
  const yieldManager = await YieldManager.deploy(musdAddress);
  await yieldManager.waitForDeployment();
  const yieldManagerAddress = await yieldManager.getAddress();
  console.log("✅ YieldManager deployed to:", yieldManagerAddress);

  // Deploy CircleFactory
  console.log("\n📝 Deploying CircleFactory...");
  const CircleFactory = await hre.ethers.getContractFactory("CircleFactory");
  const circleFactory = await CircleFactory.deploy(
    musdAddress,
    trustScoreAddress,
    insurancePoolAddress,
    yieldManagerAddress
  );
  await circleFactory.waitForDeployment();
  const circleFactoryAddress = await circleFactory.getAddress();
  console.log("✅ CircleFactory deployed to:", circleFactoryAddress);

  // Deploy MUSDIntegration
  console.log("\n📝 Deploying MUSDIntegration...");
  const MUSDIntegration = await hre.ethers.getContractFactory("MUSDIntegration");
  const musdIntegration = await MUSDIntegration.deploy(musdAddress);
  await musdIntegration.waitForDeployment();
  const musdIntegrationAddress = await musdIntegration.getAddress();
  console.log("✅ MUSDIntegration deployed to:", musdIntegrationAddress);

  // Setup authorizations
  console.log("\n🔐 Setting up contract authorizations...");

  console.log("  - Authorizing CircleFactory in TrustScore...");
  await trustScore.authorizeContract(circleFactoryAddress);

  console.log("  - Authorizing CircleFactory in InsurancePool...");
  await insurancePool.authorizeContract(circleFactoryAddress);

  console.log("  - Authorizing CircleFactory in YieldManager...");
  await yieldManager.authorizeContract(circleFactoryAddress);

  console.log("✅ Authorizations complete\n");

  // Deployment summary
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockMUSD: musdAddress,
      TrustScore: trustScoreAddress,
      InsurancePool: insurancePoolAddress,
      YieldManager: yieldManagerAddress,
      CircleFactory: circleFactoryAddress,
      MUSDIntegration: musdIntegrationAddress,
    },
  };

  console.log("📋 Deployment Summary:");
  console.log("═══════════════════════════════════════════════");
  console.log("Network:", deploymentInfo.network);
  console.log("Deployer:", deploymentInfo.deployer);
  console.log("\nContract Addresses:");
  console.log("  MockMUSD:", deploymentInfo.contracts.MockMUSD);
  console.log("  TrustScore:", deploymentInfo.contracts.TrustScore);
  console.log("  InsurancePool:", deploymentInfo.contracts.InsurancePool);
  console.log("  YieldManager:", deploymentInfo.contracts.YieldManager);
  console.log("  CircleFactory:", deploymentInfo.contracts.CircleFactory);
  console.log("  MUSDIntegration:", deploymentInfo.contracts.MUSDIntegration);
  console.log("═══════════════════════════════════════════════\n");

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}-${Date.now()}.json`
  );

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Save latest deployment
  const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Latest deployment saved to:", latestFile);

  // Generate frontend config
  const frontendConfig = `// Auto-generated contract addresses
// Network: ${deploymentInfo.network}
// Deployed: ${deploymentInfo.timestamp}

export const CONTRACTS = {
  MUSD: "${deploymentInfo.contracts.MockMUSD}",
  TrustScore: "${deploymentInfo.contracts.TrustScore}",
  InsurancePool: "${deploymentInfo.contracts.InsurancePool}",
  YieldManager: "${deploymentInfo.contracts.YieldManager}",
  CircleFactory: "${deploymentInfo.contracts.CircleFactory}",
  MUSDIntegration: "${deploymentInfo.contracts.MUSDIntegration}",
} as const;

export const NETWORK = "${deploymentInfo.network}";
export const DEPLOYER = "${deploymentInfo.deployer}";
`;

  const frontendDir = path.join(__dirname, "../frontend/lib");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const configFile = path.join(frontendDir, "contracts.ts");
  fs.writeFileSync(configFile, frontendConfig);
  console.log("💾 Frontend config saved to:", configFile);

  console.log("\n✨ Deployment complete!\n");
  console.log("Next steps:");
  console.log("  1. Verify contracts on Mezo explorer");
  console.log("  2. Update frontend/.env.local with contract addresses");
  console.log("  3. Test contract interactions on testnet");
  console.log("  4. Deploy frontend to Vercel/Netlify\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
