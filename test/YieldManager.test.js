const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("YieldManager", function () {
  let musdToken, yieldManager;
  let owner, user1, authorizedContract;
  let circleId = 1;

  beforeEach(async function () {
    [owner, user1, authorizedContract] = await ethers.getSigners();

    // Deploy MockMUSD
    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    musdToken = await MockMUSD.deploy();
    await musdToken.waitForDeployment();

    // Deploy YieldManager
    const YieldManager = await ethers.getContractFactory("YieldManager");
    yieldManager = await YieldManager.deploy(await musdToken.getAddress());
    await yieldManager.waitForDeployment();

    // Authorize contract
    await yieldManager.authorizeContract(authorizedContract.address);

    // Give authorized contract MUSD
    await musdToken.transfer(authorizedContract.address, ethers.parseEther("100000"));
    await musdToken.connect(authorizedContract).approve(await yieldManager.getAddress(), ethers.parseEther("100000"));
  });

  describe("Deployment", function () {
    it("Should set correct MUSD token address", async function () {
      expect(await yieldManager.musdToken()).to.equal(await musdToken.getAddress());
    });

    it("Should create default strategy", async function () {
      expect(await yieldManager.strategyCount()).to.equal(1);

      const strategy = await yieldManager.getStrategy(0);
      expect(strategy.name).to.equal("Internal Pool");
      expect(strategy.active).to.be.true;
    });

    it("Should set default APY to 5%", async function () {
      expect(await yieldManager.getCurrentAPY()).to.equal(500); // 5% in basis points
    });
  });

  describe("Yield Strategies", function () {
    it("Should allow owner to add new strategy", async function () {
      await expect(
        yieldManager.addYieldStrategy(user1.address, "Test Strategy")
      ).to.emit(yieldManager, "YieldStrategyAdded");

      expect(await yieldManager.strategyCount()).to.equal(2);
    });

    it("Should allow owner to update strategy status", async function () {
      await yieldManager.updateStrategyStatus(0, false);

      const strategy = await yieldManager.getStrategy(0);
      expect(strategy.active).to.be.false;
    });

    it("Should reject invalid strategy address", async function () {
      await expect(
        yieldManager.addYieldStrategy(ethers.ZeroAddress, "Invalid")
      ).to.be.revertedWith("YieldManager: Invalid protocol");
    });

    it("Should reject non-owner strategy management", async function () {
      await expect(
        yieldManager.connect(user1).addYieldStrategy(user1.address, "Test")
      ).to.be.revertedWithCustomError(yieldManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Deposit and Withdrawal", function () {
    it("Should deposit funds to yield", async function () {
      const depositAmount = ethers.parseEther("1000");

      await expect(
        yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount)
      )
        .to.emit(yieldManager, "FundsDeposited")
        .withArgs(circleId, depositAmount, 0);

      const circleYield = await yieldManager.getCircleYield(circleId);
      expect(circleYield.deposited).to.equal(depositAmount);
    });

    it("Should reject deposit with 0 amount", async function () {
      await expect(
        yieldManager.connect(authorizedContract).depositToYield(circleId, 0)
      ).to.be.revertedWith("YieldManager: Invalid amount");
    });

    it("Should reject deposit from unauthorized", async function () {
      await expect(
        yieldManager.connect(user1).depositToYield(circleId, ethers.parseEther("1000"))
      ).to.be.revertedWith("YieldManager: Not authorized");
    });

    it("Should withdraw funds from yield", async function () {
      const depositAmount = ethers.parseEther("1000");
      const withdrawAmount = ethers.parseEther("500");

      await yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount);

      await expect(
        yieldManager.connect(authorizedContract).withdrawFromYield(
          circleId,
          withdrawAmount,
          user1.address
        )
      )
        .to.emit(yieldManager, "FundsWithdrawn")
        .withArgs(circleId, withdrawAmount);

      const circleYield = await yieldManager.getCircleYield(circleId);
      expect(circleYield.deposited).to.equal(depositAmount - withdrawAmount);
    });

    it("Should reject withdrawal exceeding balance", async function () {
      await yieldManager.connect(authorizedContract).depositToYield(circleId, ethers.parseEther("1000"));

      await expect(
        yieldManager.connect(authorizedContract).withdrawFromYield(
          circleId,
          ethers.parseEther("2000"),
          user1.address
        )
      ).to.be.revertedWith("YieldManager: Insufficient balance");
    });
  });

  describe("Yield Calculation", function () {
    it("Should calculate yield over time", async function () {
      const depositAmount = ethers.parseEther("10000");

      await yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount);

      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const circleYield = await yieldManager.getCircleYield(circleId);

      // Approximately (10000 * 5% * 30/365) = ~41 MUSD
      expect(circleYield.earned).to.be.greaterThan(ethers.parseEther("30"));
      expect(circleYield.earned).to.be.lessThan(ethers.parseEther("50"));
    });

    it("Should accumulate yield over multiple periods", async function () {
      const depositAmount = ethers.parseEther("10000");

      await yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount);

      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);
      await yieldManager.calculateYield(circleId);

      const yieldAfter30 = (await yieldManager.getCircleYield(circleId)).earned;

      // Fast forward another 30 days
      await time.increase(30 * 24 * 60 * 60);
      await yieldManager.calculateYield(circleId);

      const yieldAfter60 = (await yieldManager.getCircleYield(circleId)).earned;

      expect(yieldAfter60).to.be.greaterThan(yieldAfter30);
    });

    it("Should return 0 yield for inactive circle", async function () {
      const yield1 = await yieldManager.calculateYield(999);
      expect(yield1).to.equal(0);
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      const depositAmount = ethers.parseEther("10000");
      await yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount);

      // Fast forward to generate yield
      await time.increase(30 * 24 * 60 * 60);
    });

    it("Should distribute yield successfully", async function () {
      const balanceBefore = await musdToken.balanceOf(user1.address);

      // Give YieldManager some MUSD to simulate yield
      await musdToken.transfer(await yieldManager.getAddress(), ethers.parseEther("1000"));

      await expect(
        yieldManager.connect(authorizedContract).distributeYield(circleId, user1.address)
      ).to.emit(yieldManager, "YieldDistributed");

      const balanceAfter = await musdToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("Should reset earned yield after distribution", async function () {
      // Give YieldManager MUSD
      await musdToken.transfer(await yieldManager.getAddress(), ethers.parseEther("1000"));

      await yieldManager.connect(authorizedContract).distributeYield(circleId, user1.address);

      const circleYield = await yieldManager.getCircleYield(circleId);
      expect(circleYield.earned).to.equal(0);
    });

    it("Should reject distribution with no yield", async function () {
      // Distribute once
      await musdToken.transfer(await yieldManager.getAddress(), ethers.parseEther("1000"));
      await yieldManager.connect(authorizedContract).distributeYield(circleId, user1.address);

      // Try to distribute again immediately
      await expect(
        yieldManager.connect(authorizedContract).distributeYield(circleId, user1.address)
      ).to.be.revertedWith("YieldManager: No yield to distribute");
    });
  });

  describe("APY Configuration", function () {
    it("Should allow owner to set APY", async function () {
      await yieldManager.setSimulatedAPY(1000); // 10%
      expect(await yieldManager.getCurrentAPY()).to.equal(1000);
    });

    it("Should reject APY over 100%", async function () {
      await expect(
        yieldManager.setSimulatedAPY(10001)
      ).to.be.revertedWith("YieldManager: APY too high");
    });

    it("Should affect yield calculation", async function () {
      // Set high APY
      await yieldManager.setSimulatedAPY(2000); // 20%

      const depositAmount = ethers.parseEther("10000");
      await yieldManager.connect(authorizedContract).depositToYield(circleId, depositAmount);

      await time.increase(30 * 24 * 60 * 60);

      const circleYield = await yieldManager.getCircleYield(circleId);

      // With 20% APY, should earn more than with 5%
      // Approximately (10000 * 20% * 30/365) = ~164 MUSD
      expect(circleYield.earned).to.be.greaterThan(ethers.parseEther("150"));
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await yieldManager.connect(authorizedContract).depositToYield(
        circleId,
        ethers.parseEther("10000")
      );
    });

    it("Should return circle yield information", async function () {
      const circleYield = await yieldManager.getCircleYield(circleId);

      expect(circleYield.deposited).to.equal(ethers.parseEther("10000"));
      expect(circleYield.active).to.be.true;
      expect(circleYield.lastUpdateTime).to.be.greaterThan(0);
    });

    it("Should return strategy information", async function () {
      const strategy = await yieldManager.getStrategy(0);

      expect(strategy.protocol).to.not.equal(ethers.ZeroAddress);
      expect(strategy.name).to.equal("Internal Pool");
      expect(strategy.active).to.be.true;
    });

    it("Should track total deposited in strategy", async function () {
      const strategy = await yieldManager.getStrategy(0);
      expect(strategy.totalDeposited).to.equal(ethers.parseEther("10000"));
    });
  });

  describe("Multiple Circles", function () {
    it("Should handle multiple circles independently", async function () {
      await yieldManager.connect(authorizedContract).depositToYield(1, ethers.parseEther("5000"));
      await yieldManager.connect(authorizedContract).depositToYield(2, ethers.parseEther("3000"));

      await time.increase(30 * 24 * 60 * 60);

      const yield1 = await yieldManager.getCircleYield(1);
      const yield2 = await yieldManager.getCircleYield(2);

      expect(yield1.deposited).to.equal(ethers.parseEther("5000"));
      expect(yield2.deposited).to.equal(ethers.parseEther("3000"));

      // Circle 1 should earn more (higher deposit)
      expect(yield1.earned).to.be.greaterThan(yield2.earned);
    });
  });
});
