const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePool", function () {
  let musdToken, insurancePool;
  let owner, user1, user2, user3, authorizedContract;
  let circleId = 1;
  let contributionAmount;

  beforeEach(async function () {
    [owner, user1, user2, user3, authorizedContract] = await ethers.getSigners();

    // Deploy MockMUSD
    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    musdToken = await MockMUSD.deploy();
    await musdToken.waitForDeployment();

    // Deploy InsurancePool
    const InsurancePool = await ethers.getContractFactory("InsurancePool");
    insurancePool = await InsurancePool.deploy(await musdToken.getAddress());
    await insurancePool.waitForDeployment();

    // Authorize a contract
    await insurancePool.authorizeContract(authorizedContract.address);

    // Setup
    contributionAmount = ethers.parseEther("100");

    // Give users MUSD
    await musdToken.transfer(user1.address, ethers.parseEther("10000"));
    await musdToken.transfer(user2.address, ethers.parseEther("10000"));
    await musdToken.transfer(user3.address, ethers.parseEther("10000"));

    // Approve insurance pool
    await musdToken.connect(user1).approve(await insurancePool.getAddress(), ethers.parseEther("10000"));
    await musdToken.connect(user2).approve(await insurancePool.getAddress(), ethers.parseEther("10000"));
    await musdToken.connect(user3).approve(await insurancePool.getAddress(), ethers.parseEther("10000"));
  });

  describe("Deployment", function () {
    it("Should set correct MUSD token address", async function () {
      expect(await insurancePool.musdToken()).to.equal(await musdToken.getAddress());
    });

    it("Should set default insurance percentage to 15%", async function () {
      expect(await insurancePool.defaultInsurancePercent()).to.equal(15);
    });
  });

  describe("Insurance Deposit", function () {
    it("Should deposit insurance successfully", async function () {
      const expectedInsurance = (contributionAmount * 15n) / 100n; // 15%

      await expect(
        insurancePool.connect(authorizedContract).depositInsurance(
          circleId,
          user1.address,
          contributionAmount
        )
      )
        .to.emit(insurancePool, "InsuranceDeposited")
        .withArgs(circleId, user1.address, expectedInsurance);

      const stake = await insurancePool.getInsuranceStake(circleId, user1.address);
      expect(stake).to.equal(expectedInsurance);
    });

    it("Should increase pool balance", async function () {
      const expectedInsurance = (contributionAmount * 15n) / 100n;

      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );

      const poolBalance = await insurancePool.getPoolBalance(circleId);
      expect(poolBalance).to.equal(expectedInsurance);
    });

    it("Should handle multiple deposits", async function () {
      const expectedInsurance = (contributionAmount * 15n) / 100n;

      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );

      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user2.address,
        contributionAmount
      );

      const poolBalance = await insurancePool.getPoolBalance(circleId);
      expect(poolBalance).to.equal(expectedInsurance * 2n);
    });

    it("Should reject deposit from unauthorized caller", async function () {
      await expect(
        insurancePool.connect(user1).depositInsurance(
          circleId,
          user1.address,
          contributionAmount
        )
      ).to.be.revertedWith("InsurancePool: Not authorized");
    });

    it("Should prevent defaulters from depositing", async function () {
      // Mark user as defaulter first
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );

      await insurancePool.connect(authorizedContract).processDefaultClaim(
        circleId,
        user1.address,
        contributionAmount
      );

      // Try to deposit again
      await expect(
        insurancePool.connect(authorizedContract).depositInsurance(
          2,
          user1.address,
          contributionAmount
        )
      ).to.be.revertedWith("InsurancePool: Member is a defaulter");
    });
  });

  describe("Default Claims", function () {
    beforeEach(async function () {
      // Setup insurance pool with multiple members
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user2.address,
        contributionAmount
      );
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user3.address,
        contributionAmount
      );
    });

    it("Should process default claim successfully", async function () {
      const missedAmount = ethers.parseEther("50");

      await expect(
        insurancePool.connect(authorizedContract).processDefaultClaim(
          circleId,
          user1.address,
          missedAmount
        )
      )
        .to.emit(insurancePool, "DefaultClaimed")
        .withArgs(circleId, user1.address, missedAmount);

      expect(await insurancePool.isDefaulter(user1.address)).to.be.true;
    });

    it("Should reduce pool balance by claim amount", async function () {
      const missedAmount = ethers.parseEther("50");
      const poolBefore = await insurancePool.getPoolBalance(circleId);

      await insurancePool.connect(authorizedContract).processDefaultClaim(
        circleId,
        user1.address,
        missedAmount
      );

      const poolAfter = await insurancePool.getPoolBalance(circleId);
      expect(poolBefore - poolAfter).to.equal(missedAmount);
    });

    it("Should set defaulter's stake to 0", async function () {
      const missedAmount = ethers.parseEther("50");

      await insurancePool.connect(authorizedContract).processDefaultClaim(
        circleId,
        user1.address,
        missedAmount
      );

      const stake = await insurancePool.getInsuranceStake(circleId, user1.address);
      expect(stake).to.equal(0);
    });

    it("Should reject claim exceeding pool balance", async function () {
      const excessiveAmount = ethers.parseEther("1000");

      await expect(
        insurancePool.connect(authorizedContract).processDefaultClaim(
          circleId,
          user1.address,
          excessiveAmount
        )
      ).to.be.revertedWith("InsurancePool: Insufficient pool");
    });

    it("Should reject claim after distribution", async function () {
      // Distribute insurance first
      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address, user2.address, user3.address]
      );

      await expect(
        insurancePool.connect(authorizedContract).processDefaultClaim(
          circleId,
          user1.address,
          ethers.parseEther("50")
        )
      ).to.be.revertedWith("InsurancePool: Already distributed");
    });
  });

  describe("Bonus Yield", function () {
    it("Should add bonus yield to pool", async function () {
      const bonusAmount = ethers.parseEther("100");

      // Transfer MUSD to authorized contract first
      await musdToken.transfer(authorizedContract.address, bonusAmount);
      await musdToken.connect(authorizedContract).approve(await insurancePool.getAddress(), bonusAmount);

      await expect(
        insurancePool.connect(authorizedContract).addBonusYield(circleId, bonusAmount)
      )
        .to.emit(insurancePool, "BonusAdded")
        .withArgs(circleId, bonusAmount);

      const details = await insurancePool.getInsuranceDetails(circleId);
      expect(details.bonusPool).to.equal(bonusAmount);
    });
  });

  describe("Insurance Distribution", function () {
    beforeEach(async function () {
      // Setup insurance pool
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user2.address,
        contributionAmount
      );
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user3.address,
        contributionAmount
      );
    });

    it("Should distribute insurance to members", async function () {
      const stake = await insurancePool.getInsuranceStake(circleId, user1.address);
      const balanceBefore = await musdToken.balanceOf(user1.address);

      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address, user2.address, user3.address]
      );

      const balanceAfter = await musdToken.balanceOf(user1.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
      expect(balanceAfter - balanceBefore).to.be.at.least(stake);
    });

    it("Should distribute bonus to members", async function () {
      const bonusAmount = ethers.parseEther("300"); // 100 per member

      // Add bonus
      await musdToken.transfer(authorizedContract.address, bonusAmount);
      await musdToken.connect(authorizedContract).approve(await insurancePool.getAddress(), bonusAmount);
      await insurancePool.connect(authorizedContract).addBonusYield(circleId, bonusAmount);

      const stake = await insurancePool.getInsuranceStake(circleId, user1.address);
      const expectedBonus = bonusAmount / 3n;
      const balanceBefore = await musdToken.balanceOf(user1.address);

      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address, user2.address, user3.address]
      );

      const balanceAfter = await musdToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(stake + expectedBonus);
    });

    it("Should skip defaulters in distribution", async function () {
      // Mark user1 as defaulter
      await insurancePool.connect(authorizedContract).processDefaultClaim(
        circleId,
        user1.address,
        ethers.parseEther("50")
      );

      const balanceBefore = await musdToken.balanceOf(user1.address);

      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address, user2.address, user3.address]
      );

      const balanceAfter = await musdToken.balanceOf(user1.address);
      expect(balanceAfter).to.equal(balanceBefore); // No change for defaulter
    });

    it("Should prevent double distribution", async function () {
      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address, user2.address, user3.address]
      );

      await expect(
        insurancePool.connect(authorizedContract).distributeInsurance(
          circleId,
          [user1.address, user2.address, user3.address]
        )
      ).to.be.revertedWith("InsurancePool: Already distributed");
    });

    it("Should emit distribution events", async function () {
      await expect(
        insurancePool.connect(authorizedContract).distributeInsurance(
          circleId,
          [user1.address, user2.address, user3.address]
        )
      ).to.emit(insurancePool, "InsuranceDistributed");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await insurancePool.connect(authorizedContract).depositInsurance(
        circleId,
        user1.address,
        contributionAmount
      );
    });

    it("Should return insurance details", async function () {
      const details = await insurancePool.getInsuranceDetails(circleId);

      expect(details.totalPool).to.be.greaterThan(0);
      expect(details.claimsProcessed).to.equal(0);
      expect(details.distributed).to.be.false;
    });

    it("Should check withdrawal status", async function () {
      expect(await insurancePool.hasWithdrawn(circleId, user1.address)).to.be.false;

      await insurancePool.connect(authorizedContract).distributeInsurance(
        circleId,
        [user1.address]
      );

      expect(await insurancePool.hasWithdrawn(circleId, user1.address)).to.be.true;
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to change insurance percentage", async function () {
      await insurancePool.setDefaultInsurancePercent(20);
      expect(await insurancePool.defaultInsurancePercent()).to.equal(20);
    });

    it("Should reject invalid insurance percentage", async function () {
      await expect(
        insurancePool.setDefaultInsurancePercent(5)
      ).to.be.revertedWith("InsurancePool: Invalid percentage");

      await expect(
        insurancePool.setDefaultInsurancePercent(25)
      ).to.be.revertedWith("InsurancePool: Invalid percentage");
    });
  });
});
