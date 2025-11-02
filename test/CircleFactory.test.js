const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CircleFactory", function () {
  let musdToken, trustScore, insurancePool, yieldManager, circleFactory;
  let owner, user1, user2, user3, user4, user5;
  let contributionAmount, duration, maxMembers;

  beforeEach(async function () {
    [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();

    // Deploy MockMUSD
    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    musdToken = await MockMUSD.deploy();
    await musdToken.waitForDeployment();

    // Deploy TrustScore
    const TrustScore = await ethers.getContractFactory("TrustScore");
    trustScore = await TrustScore.deploy();
    await trustScore.waitForDeployment();

    // Deploy InsurancePool
    const InsurancePool = await ethers.getContractFactory("InsurancePool");
    insurancePool = await InsurancePool.deploy(await musdToken.getAddress());
    await insurancePool.waitForDeployment();

    // Deploy YieldManager
    const YieldManager = await ethers.getContractFactory("YieldManager");
    yieldManager = await YieldManager.deploy(await musdToken.getAddress());
    await yieldManager.waitForDeployment();

    // Deploy CircleFactory
    const CircleFactory = await ethers.getContractFactory("CircleFactory");
    circleFactory = await CircleFactory.deploy(
      await musdToken.getAddress(),
      await trustScore.getAddress(),
      await insurancePool.getAddress(),
      await yieldManager.getAddress()
    );
    await circleFactory.waitForDeployment();

    // Authorize CircleFactory in other contracts
    await trustScore.authorizeContract(await circleFactory.getAddress());
    await insurancePool.authorizeContract(await circleFactory.getAddress());
    await yieldManager.authorizeContract(await circleFactory.getAddress());

    // Setup test parameters
    contributionAmount = ethers.parseEther("100"); // $100
    duration = 6; // 6 months
    maxMembers = 5;

    // Give users MUSD tokens
    const initialBalance = ethers.parseEther("10000");
    await musdToken.transfer(user1.address, initialBalance);
    await musdToken.transfer(user2.address, initialBalance);
    await musdToken.transfer(user3.address, initialBalance);
    await musdToken.transfer(user4.address, initialBalance);
    await musdToken.transfer(user5.address, initialBalance);

    // Approve CircleFactory and InsurancePool to spend MUSD
    const approvalAmount = ethers.parseEther("100000");
    await musdToken.connect(user1).approve(await circleFactory.getAddress(), approvalAmount);
    await musdToken.connect(user2).approve(await circleFactory.getAddress(), approvalAmount);
    await musdToken.connect(user3).approve(await circleFactory.getAddress(), approvalAmount);
    await musdToken.connect(user4).approve(await circleFactory.getAddress(), approvalAmount);
    await musdToken.connect(user5).approve(await circleFactory.getAddress(), approvalAmount);

    await musdToken.connect(user1).approve(await insurancePool.getAddress(), approvalAmount);
    await musdToken.connect(user2).approve(await insurancePool.getAddress(), approvalAmount);
    await musdToken.connect(user3).approve(await insurancePool.getAddress(), approvalAmount);
    await musdToken.connect(user4).approve(await insurancePool.getAddress(), approvalAmount);
    await musdToken.connect(user5).approve(await insurancePool.getAddress(), approvalAmount);
  });

  describe("Deployment", function () {
    it("Should set correct contract addresses", async function () {
      expect(await circleFactory.musdToken()).to.equal(await musdToken.getAddress());
      expect(await circleFactory.trustScore()).to.equal(await trustScore.getAddress());
      expect(await circleFactory.insurancePool()).to.equal(await insurancePool.getAddress());
      expect(await circleFactory.yieldManager()).to.equal(await yieldManager.getAddress());
    });

    it("Should initialize with 0 circles", async function () {
      expect(await circleFactory.getTotalCircles()).to.equal(0);
    });
  });

  describe("Circle Creation", function () {
    it("Should create a circle successfully", async function () {
      const tx = await circleFactory.connect(user1).createCircle(
        contributionAmount,
        duration,
        maxMembers,
        0 // requiredTrustScore
      );

      await expect(tx)
        .to.emit(circleFactory, "CircleCreated")
        .withArgs(0, user1.address, contributionAmount, duration, maxMembers);

      expect(await circleFactory.getTotalCircles()).to.equal(1);
    });

    it("Should automatically add creator as first member", async function () {
      await circleFactory.connect(user1).createCircle(
        contributionAmount,
        duration,
        maxMembers,
        0
      );

      const members = await circleFactory.getCircleMembers(0);
      expect(members).to.include(user1.address);
      expect(members.length).to.equal(1);
    });

    it("Should reject invalid contribution amount", async function () {
      const tooLow = ethers.parseEther("10"); // Below MIN_CONTRIBUTION
      await expect(
        circleFactory.connect(user1).createCircle(tooLow, duration, maxMembers, 0)
      ).to.be.revertedWith("CircleFactory: Contribution too low");
    });

    it("Should reject invalid duration", async function () {
      await expect(
        circleFactory.connect(user1).createCircle(contributionAmount, 2, maxMembers, 0)
      ).to.be.revertedWith("CircleFactory: Invalid duration");

      await expect(
        circleFactory.connect(user1).createCircle(contributionAmount, 30, maxMembers, 0)
      ).to.be.revertedWith("CircleFactory: Invalid duration");
    });

    it("Should reject invalid member count", async function () {
      await expect(
        circleFactory.connect(user1).createCircle(contributionAmount, duration, 2, 0)
      ).to.be.revertedWith("CircleFactory: Invalid member count");

      await expect(
        circleFactory.connect(user1).createCircle(contributionAmount, duration, 25, 0)
      ).to.be.revertedWith("CircleFactory: Invalid member count");
    });
  });

  describe("Circle Joining", function () {
    beforeEach(async function () {
      await circleFactory.connect(user1).createCircle(
        contributionAmount,
        duration,
        maxMembers,
        0
      );
    });

    it("Should allow users to join a circle", async function () {
      await expect(circleFactory.connect(user2).joinCircle(0))
        .to.emit(circleFactory, "MemberJoined")
        .withArgs(0, user2.address);

      const members = await circleFactory.getCircleMembers(0);
      expect(members).to.include(user2.address);
      expect(members.length).to.equal(2);
    });

    it("Should prevent joining the same circle twice", async function () {
      await expect(
        circleFactory.connect(user1).joinCircle(0)
      ).to.be.revertedWith("CircleFactory: Already a member");
    });

    it("Should prevent joining when circle is full", async function () {
      // Fill the circle
      await circleFactory.connect(user2).joinCircle(0);
      await circleFactory.connect(user3).joinCircle(0);
      await circleFactory.connect(user4).joinCircle(0);
      await circleFactory.connect(user5).joinCircle(0);

      // Try to join when full
      const [,,,,,, user6] = await ethers.getSigners();
      await musdToken.transfer(user6.address, ethers.parseEther("10000"));
      await musdToken.connect(user6).approve(await circleFactory.getAddress(), ethers.parseEther("10000"));
      await musdToken.connect(user6).approve(await insurancePool.getAddress(), ethers.parseEther("10000"));

      await expect(
        circleFactory.connect(user6).joinCircle(0)
      ).to.be.revertedWith("CircleFactory: Circle is full");
    });

    it("Should require insurance deposit when joining", async function () {
      const insuranceAmount = (contributionAmount * 15n) / 100n; // 15%

      const balanceBefore = await musdToken.balanceOf(user2.address);
      await circleFactory.connect(user2).joinCircle(0);
      const balanceAfter = await musdToken.balanceOf(user2.address);

      expect(balanceBefore - balanceAfter).to.equal(insuranceAmount);
    });
  });

  describe("Contributions and Payouts", function () {
    beforeEach(async function () {
      // Create and fill a circle
      await circleFactory.connect(user1).createCircle(
        contributionAmount,
        duration,
        maxMembers,
        0
      );
      await circleFactory.connect(user2).joinCircle(0);
      await circleFactory.connect(user3).joinCircle(0);
      await circleFactory.connect(user4).joinCircle(0);
      await circleFactory.connect(user5).joinCircle(0);
    });

    it("Should accept contributions when circle is full", async function () {
      await expect(circleFactory.connect(user1).makeContribution(0))
        .to.emit(circleFactory, "ContributionMade")
        .withArgs(0, user1.address, contributionAmount, 1);
    });

    it("Should reject duplicate contributions in same month", async function () {
      await circleFactory.connect(user1).makeContribution(0);

      await expect(
        circleFactory.connect(user1).makeContribution(0)
      ).to.be.revertedWith("CircleFactory: Already paid this month");
    });

    it("Should process payout when all members contribute", async function () {
      const recipient = user1.address; // First in queue
      const expectedPayout = contributionAmount * 5n; // 5 members

      const balanceBefore = await musdToken.balanceOf(recipient);

      // All members contribute
      await circleFactory.connect(user1).makeContribution(0);
      await circleFactory.connect(user2).makeContribution(0);
      await circleFactory.connect(user3).makeContribution(0);
      await circleFactory.connect(user4).makeContribution(0);

      await expect(circleFactory.connect(user5).makeContribution(0))
        .to.emit(circleFactory, "PayoutProcessed")
        .withArgs(0, recipient, expectedPayout, 1);

      const balanceAfter = await musdToken.balanceOf(recipient);
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
    });

    it("Should advance to next month after payout", async function () {
      // Month 1 contributions
      await circleFactory.connect(user1).makeContribution(0);
      await circleFactory.connect(user2).makeContribution(0);
      await circleFactory.connect(user3).makeContribution(0);
      await circleFactory.connect(user4).makeContribution(0);
      await circleFactory.connect(user5).makeContribution(0);

      const details = await circleFactory.getCircleDetails(0);
      expect(details.currentMonth).to.equal(2); // Advanced to month 2
    });

    it("Should update trust score on contribution", async function () {
      await circleFactory.connect(user1).makeContribution(0);

      const score = await trustScore.getTrustScore(user1.address);
      expect(score).to.be.greaterThan(0);
    });
  });

  describe("Circle Completion", function () {
    beforeEach(async function () {
      // Create and fill a circle with 3 members for faster testing
      await circleFactory.connect(user1).createCircle(
        contributionAmount,
        3, // 3 months duration
        3, // 3 members
        0
      );
      await circleFactory.connect(user2).joinCircle(0);
      await circleFactory.connect(user3).joinCircle(0);
    });

    it("Should complete circle after all payouts", async function () {
      // Month 1
      await circleFactory.connect(user1).makeContribution(0);
      await circleFactory.connect(user2).makeContribution(0);
      await circleFactory.connect(user3).makeContribution(0);

      // Month 2
      await circleFactory.connect(user1).makeContribution(0);
      await circleFactory.connect(user2).makeContribution(0);
      await circleFactory.connect(user3).makeContribution(0);

      // Month 3
      await circleFactory.connect(user1).makeContribution(0);
      await circleFactory.connect(user2).makeContribution(0);

      await expect(circleFactory.connect(user3).makeContribution(0))
        .to.emit(circleFactory, "CircleCompleted")
        .withArgs(0);

      const details = await circleFactory.getCircleDetails(0);
      expect(details.status).to.equal(1); // Completed
    });

    it("Should update all members' trust scores on completion", async function () {
      // Complete the circle
      for (let month = 0; month < 3; month++) {
        await circleFactory.connect(user1).makeContribution(0);
        await circleFactory.connect(user2).makeContribution(0);
        await circleFactory.connect(user3).makeContribution(0);
      }

      // Check trust scores increased
      const score1 = await trustScore.getTrustScore(user1.address);
      const score2 = await trustScore.getTrustScore(user2.address);
      const score3 = await trustScore.getTrustScore(user3.address);

      expect(score1).to.be.greaterThan(0);
      expect(score2).to.be.greaterThan(0);
      expect(score3).to.be.greaterThan(0);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await circleFactory.connect(user1).createCircle(
        contributionAmount,
        duration,
        maxMembers,
        0
      );
      await circleFactory.connect(user2).joinCircle(0);
    });

    it("Should return correct circle details", async function () {
      const details = await circleFactory.getCircleDetails(0);

      expect(details.circleId).to.equal(0);
      expect(details.creator).to.equal(user1.address);
      expect(details.contributionAmount).to.equal(contributionAmount);
      expect(details.duration).to.equal(duration);
      expect(details.maxMembers).to.equal(maxMembers);
      expect(details.currentMembers).to.equal(2);
    });

    it("Should return user circles", async function () {
      const circles = await circleFactory.getUserCircles(user1.address);
      expect(circles).to.have.lengthOf(1);
      expect(circles[0]).to.equal(0);
    });

    it("Should return circle members", async function () {
      const members = await circleFactory.getCircleMembers(0);
      expect(members).to.have.lengthOf(2);
      expect(members).to.include(user1.address);
      expect(members).to.include(user2.address);
    });

    it("Should check payment status", async function () {
      // Fill circle first
      await circleFactory.connect(user3).joinCircle(0);
      await circleFactory.connect(user4).joinCircle(0);
      await circleFactory.connect(user5).joinCircle(0);

      expect(await circleFactory.hasPaidCurrentMonth(0, user1.address)).to.be.false;

      await circleFactory.connect(user1).makeContribution(0);

      expect(await circleFactory.hasPaidCurrentMonth(0, user1.address)).to.be.true;
    });
  });
});
