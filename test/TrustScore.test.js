const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TrustScore", function () {
  let trustScore;
  let owner, user1, user2, authorizedContract;

  beforeEach(async function () {
    [owner, user1, user2, authorizedContract] = await ethers.getSigners();

    const TrustScore = await ethers.getContractFactory("TrustScore");
    trustScore = await TrustScore.deploy();
    await trustScore.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await trustScore.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct tier thresholds", async function () {
      expect(await trustScore.SILVER_THRESHOLD()).to.equal(250);
      expect(await trustScore.GOLD_THRESHOLD()).to.equal(500);
      expect(await trustScore.PLATINUM_THRESHOLD()).to.equal(750);
    });
  });

  describe("Authorization", function () {
    it("Should allow owner to authorize contracts", async function () {
      await trustScore.authorizeContract(authorizedContract.address);
      expect(await trustScore.authorizedContracts(authorizedContract.address)).to.be.true;
    });

    it("Should allow owner to revoke authorization", async function () {
      await trustScore.authorizeContract(authorizedContract.address);
      await trustScore.revokeContract(authorizedContract.address);
      expect(await trustScore.authorizedContracts(authorizedContract.address)).to.be.false;
    });

    it("Should revert when non-owner tries to authorize", async function () {
      await expect(
        trustScore.connect(user1).authorizeContract(authorizedContract.address)
      ).to.be.revertedWithCustomError(trustScore, "OwnableUnauthorizedAccount");
    });
  });

  describe("Trust Score Calculation", function () {
    beforeEach(async function () {
      await trustScore.authorizeContract(owner.address);
    });

    it("Should start with 0 trust score for new users", async function () {
      expect(await trustScore.getTrustScore(user1.address)).to.equal(0);
    });

    it("Should calculate correct score after on-time payments", async function () {
      // Make 10 on-time payments
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }

      const score = await trustScore.getTrustScore(user1.address);
      // 10/10 on-time = 400 points + 100 DeFi bonus = 500
      expect(score).to.equal(500);
    });

    it("Should penalize late payments", async function () {
      // 5 on-time, 5 late
      for (let i = 0; i < 5; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      for (let i = 0; i < 5; i++) {
        await trustScore.updatePaymentRecord(user1.address, false);
      }

      const score = await trustScore.getTrustScore(user1.address);
      // 5/10 on-time = 200 points + 100 DeFi bonus = 300
      expect(score).to.equal(300);
    });

    it("Should increase score with circle completions", async function () {
      // 10 payments + 1 completed circle
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      await trustScore.recordCircleCompletion(user1.address, false);

      const score = await trustScore.getTrustScore(user1.address);
      // 400 (payments) + 300 (1/1 circles) + 100 (DeFi) = 800
      expect(score).to.equal(800);
    });

    it("Should heavily penalize defaults", async function () {
      // Build up score first
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      await trustScore.recordCircleCompletion(user1.address, false);

      let score = await trustScore.getTrustScore(user1.address);
      expect(score).to.equal(800);

      // Now default
      await trustScore.recordCircleCompletion(user1.address, true);

      score = await trustScore.getTrustScore(user1.address);
      // Should lose 200 points
      expect(score).to.be.lessThan(650);
    });

    it("Should cap score at 1000", async function () {
      // Try to get more than 1000 points
      for (let i = 0; i < 100; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      for (let i = 0; i < 10; i++) {
        await trustScore.recordCircleCompletion(user1.address, false);
      }

      const score = await trustScore.getTrustScore(user1.address);
      expect(score).to.equal(1000);
    });
  });

  describe("Trust Tiers", function () {
    beforeEach(async function () {
      await trustScore.authorizeContract(owner.address);
    });

    it("Should assign Newcomer tier for score 0-249", async function () {
      await trustScore.updatePaymentRecord(user1.address, true);
      const tier = await trustScore.getTrustTier(user1.address);
      expect(tier).to.equal(0); // Newcomer
    });

    it("Should assign Silver tier for score 250-499", async function () {
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      const tier = await trustScore.getTrustTier(user1.address);
      expect(tier).to.equal(1); // Silver
    });

    it("Should assign Gold tier for score 500-749", async function () {
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      await trustScore.recordCircleCompletion(user1.address, false);

      const tier = await trustScore.getTrustTier(user1.address);
      expect(tier).to.equal(2); // Gold
    });

    it("Should assign Platinum tier for score 750+", async function () {
      for (let i = 0; i < 20; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      for (let i = 0; i < 2; i++) {
        await trustScore.recordCircleCompletion(user1.address, false);
      }

      const tier = await trustScore.getTrustTier(user1.address);
      expect(tier).to.equal(3); // Platinum
    });
  });

  describe("Circle Joining Eligibility", function () {
    beforeEach(async function () {
      await trustScore.authorizeContract(owner.address);
    });

    it("Should allow Newcomer to join small circles only", async function () {
      const newcomerMax = await trustScore.NEWCOMER_MAX();

      expect(await trustScore.canJoinCircle(user1.address, newcomerMax)).to.be.true;
      expect(await trustScore.canJoinCircle(user1.address, newcomerMax + 1n)).to.be.false;
    });

    it("Should allow Silver to join medium circles", async function () {
      // Get to Silver tier
      for (let i = 0; i < 10; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }

      const silverMax = await trustScore.SILVER_MAX();
      expect(await trustScore.canJoinCircle(user1.address, silverMax)).to.be.true;
    });

    it("Should allow Platinum unlimited circles", async function () {
      // Get to Platinum tier
      for (let i = 0; i < 20; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      for (let i = 0; i < 2; i++) {
        await trustScore.recordCircleCompletion(user1.address, false);
      }

      const largeAmount = ethers.parseEther("100000");
      expect(await trustScore.canJoinCircle(user1.address, largeAmount)).to.be.true;
    });
  });

  describe("User Trust Metrics", function () {
    beforeEach(async function () {
      await trustScore.authorizeContract(owner.address);
    });

    it("Should return correct metrics", async function () {
      // 3 on-time payments, 2 late payments, 1 completed circle
      for (let i = 0; i < 3; i++) {
        await trustScore.updatePaymentRecord(user1.address, true);
      }
      for (let i = 0; i < 2; i++) {
        await trustScore.updatePaymentRecord(user1.address, false);
      }
      await trustScore.recordCircleCompletion(user1.address, false);

      const metrics = await trustScore.getUserTrustMetrics(user1.address);

      expect(metrics.totalPayments).to.equal(5);
      expect(metrics.onTimePayments).to.equal(3);
      expect(metrics.latePayments).to.equal(2);
      expect(metrics.completedCircles).to.equal(1);
      expect(metrics.totalCircles).to.equal(1);
      expect(metrics.defaultedCircles).to.equal(0);
    });
  });

  describe("Events", function () {
    beforeEach(async function () {
      await trustScore.authorizeContract(owner.address);
    });

    it("Should emit TrustScoreUpdated event", async function () {
      await expect(trustScore.updatePaymentRecord(user1.address, true))
        .to.emit(trustScore, "TrustScoreUpdated");
    });

    it("Should emit PaymentRecorded event", async function () {
      await expect(trustScore.updatePaymentRecord(user1.address, true))
        .to.emit(trustScore, "PaymentRecorded")
        .withArgs(user1.address, true);
    });

    it("Should emit CircleCompletionRecorded event", async function () {
      await expect(trustScore.recordCircleCompletion(user1.address, false))
        .to.emit(trustScore, "CircleCompletionRecorded")
        .withArgs(user1.address, false);
    });
  });
});
