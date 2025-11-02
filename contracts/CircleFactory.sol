// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ICircleFactory.sol";
import "./interfaces/ITrustScore.sol";
import "./interfaces/IMUSD.sol";
import "./TrustScore.sol";
import "./InsurancePool.sol";
import "./YieldManager.sol";

/**
 * @title CircleFactory
 * @dev Main contract for creating and managing lending circles (ROSCAs)
 *
 * Key Features:
 * - Create new circles with custom parameters
 * - Join existing circles with trust tier validation
 * - Monthly contribution tracking
 * - Automatic payout rotation
 * - Integration with TrustScore, Insurance, and Yield systems
 */
contract CircleFactory is ICircleFactory, Ownable, ReentrancyGuard {
    IMUSD public musdToken;
    TrustScore public trustScore;
    InsurancePool public insurancePool;
    YieldManager public yieldManager;

    struct Circle {
        uint256 circleId;
        address creator;
        uint256 contributionAmount;
        uint256 duration;
        uint256 maxMembers;
        uint256 currentMembers;
        uint256 currentMonth;
        CircleStatus status;
        uint256 requiredTrustScore;
        uint256 createdAt;
        address[] members;
        mapping(uint256 => mapping(address => bool)) monthlyPayments; // month => member => paid
        mapping(address => bool) hasReceivedPayout;
        address[] payoutQueue; // Order of payout recipients
        uint256 nextPayoutIndex;
    }

    uint256 public circleCount;
    mapping(uint256 => Circle) private circles;
    mapping(address => uint256[]) private userCircles;

    // Minimum and maximum circle parameters
    uint256 public constant MIN_CONTRIBUTION = 50 * 10**18; // $50
    uint256 public constant MIN_DURATION = 3; // 3 months
    uint256 public constant MAX_DURATION = 24; // 24 months
    uint256 public constant MIN_MEMBERS = 3;
    uint256 public constant MAX_MEMBERS = 20;

    // Grace period for late payments (in seconds)
    uint256 public constant GRACE_PERIOD = 7 days;

    modifier circleExists(uint256 circleId) {
        require(circleId < circleCount, "CircleFactory: Circle does not exist");
        _;
    }

    modifier onlyCircleMember(uint256 circleId) {
        require(_isCircleMember(circleId, msg.sender), "CircleFactory: Not a member");
        _;
    }

    constructor(
        address _musdToken,
        address _trustScore,
        address _insurancePool,
        address _yieldManager
    ) Ownable(msg.sender) {
        require(_musdToken != address(0), "CircleFactory: Invalid MUSD address");
        require(_trustScore != address(0), "CircleFactory: Invalid TrustScore address");
        require(_insurancePool != address(0), "CircleFactory: Invalid InsurancePool address");
        require(_yieldManager != address(0), "CircleFactory: Invalid YieldManager address");

        musdToken = IMUSD(_musdToken);
        trustScore = TrustScore(_trustScore);
        insurancePool = InsurancePool(_insurancePool);
        yieldManager = YieldManager(_yieldManager);
    }

    /**
     * @dev Creates a new lending circle
     */
    function createCircle(
        uint256 contributionAmount,
        uint256 duration,
        uint256 maxMembers,
        uint256 requiredTrustScore
    ) external override nonReentrant returns (uint256) {
        // Validate parameters
        require(contributionAmount >= MIN_CONTRIBUTION, "CircleFactory: Contribution too low");
        require(duration >= MIN_DURATION && duration <= MAX_DURATION, "CircleFactory: Invalid duration");
        require(maxMembers >= MIN_MEMBERS && maxMembers <= MAX_MEMBERS, "CircleFactory: Invalid member count");
        require(requiredTrustScore <= 1000, "CircleFactory: Invalid trust score requirement");

        // Check creator's trust score
        uint256 creatorScore = trustScore.getTrustScore(msg.sender);
        require(creatorScore >= requiredTrustScore, "CircleFactory: Insufficient trust score");

        // Check if creator can join circle with this contribution amount
        require(
            trustScore.canJoinCircle(msg.sender, contributionAmount),
            "CircleFactory: Contribution exceeds tier limit"
        );

        uint256 circleId = circleCount++;
        Circle storage circle = circles[circleId];

        circle.circleId = circleId;
        circle.creator = msg.sender;
        circle.contributionAmount = contributionAmount;
        circle.duration = duration;
        circle.maxMembers = maxMembers;
        circle.currentMembers = 0;
        circle.currentMonth = 0;
        circle.status = CircleStatus.Active;
        circle.requiredTrustScore = requiredTrustScore;
        circle.createdAt = block.timestamp;
        circle.nextPayoutIndex = 0;

        emit CircleCreated(circleId, msg.sender, contributionAmount, duration, maxMembers);

        // Creator automatically joins the circle
        _joinCircle(circleId, msg.sender);

        return circleId;
    }

    /**
     * @dev Allows a user to join an existing circle
     */
    function joinCircle(uint256 circleId) external override circleExists(circleId) nonReentrant {
        _joinCircle(circleId, msg.sender);
    }

    /**
     * @dev Internal function to handle circle joining
     */
    function _joinCircle(uint256 circleId, address member) internal {
        Circle storage circle = circles[circleId];

        require(circle.status == CircleStatus.Active, "CircleFactory: Circle not active");
        require(circle.currentMembers < circle.maxMembers, "CircleFactory: Circle is full");
        require(!_isCircleMember(circleId, member), "CircleFactory: Already a member");

        // Check trust score requirement
        uint256 memberScore = trustScore.getTrustScore(member);
        require(memberScore >= circle.requiredTrustScore, "CircleFactory: Insufficient trust score");

        // Check tier limits
        require(
            trustScore.canJoinCircle(member, circle.contributionAmount),
            "CircleFactory: Contribution exceeds tier limit"
        );

        // Add member
        circle.members.push(member);
        circle.currentMembers++;
        userCircles[member].push(circleId);

        // Deposit insurance
        insurancePool.depositInsurance(circleId, member, circle.contributionAmount);

        // Add to payout queue
        circle.payoutQueue.push(member);

        emit MemberJoined(circleId, member);

        // If circle is full, start the first month
        if (circle.currentMembers == circle.maxMembers) {
            circle.currentMonth = 1;
        }
    }

    /**
     * @dev Makes a monthly contribution to a circle
     */
    function makeContribution(uint256 circleId)
        external
        override
        circleExists(circleId)
        onlyCircleMember(circleId)
        nonReentrant
    {
        Circle storage circle = circles[circleId];

        require(circle.status == CircleStatus.Active, "CircleFactory: Circle not active");
        require(circle.currentMembers == circle.maxMembers, "CircleFactory: Circle not full yet");
        require(circle.currentMonth > 0 && circle.currentMonth <= circle.duration, "CircleFactory: Invalid month");
        require(
            !circle.monthlyPayments[circle.currentMonth][msg.sender],
            "CircleFactory: Already paid this month"
        );

        // Transfer contribution
        require(
            musdToken.transferFrom(msg.sender, address(this), circle.contributionAmount),
            "CircleFactory: Transfer failed"
        );

        // Mark as paid
        circle.monthlyPayments[circle.currentMonth][msg.sender] = true;

        // Update trust score
        trustScore.updatePaymentRecord(msg.sender, true);

        emit ContributionMade(circleId, msg.sender, circle.contributionAmount, circle.currentMonth);

        // Check if all members have paid
        if (_allMembersPaid(circleId)) {
            _processMonthlyPayout(circleId);
        }
    }

    /**
     * @dev Processes monthly payout for the next recipient
     */
    function processMonthlyPayout(uint256 circleId)
        external
        override
        circleExists(circleId)
        nonReentrant
    {
        Circle storage circle = circles[circleId];
        require(circle.status == CircleStatus.Active, "CircleFactory: Circle not active");
        require(_allMembersPaid(circleId), "CircleFactory: Not all members paid");

        _processMonthlyPayout(circleId);
    }

    /**
     * @dev Internal function to process payout
     */
    function _processMonthlyPayout(uint256 circleId) internal {
        Circle storage circle = circles[circleId];

        require(circle.nextPayoutIndex < circle.payoutQueue.length, "CircleFactory: No more recipients");

        address recipient = circle.payoutQueue[circle.nextPayoutIndex];
        uint256 payoutAmount = circle.contributionAmount * circle.currentMembers;

        // Mark recipient as having received payout
        circle.hasReceivedPayout[recipient] = true;
        circle.nextPayoutIndex++;

        // Transfer payout
        require(
            musdToken.transfer(recipient, payoutAmount),
            "CircleFactory: Payout failed"
        );

        emit PayoutProcessed(circleId, recipient, payoutAmount, circle.currentMonth);

        // Deploy remaining funds to yield (if any)
        uint256 remainingBalance = musdToken.balanceOf(address(this));
        if (remainingBalance > 0) {
            musdToken.approve(address(yieldManager), remainingBalance);
            yieldManager.depositToYield(circleId, remainingBalance);
        }

        // Move to next month or complete circle
        if (circle.currentMonth >= circle.duration) {
            _completeCircle(circleId);
        } else {
            circle.currentMonth++;
        }
    }

    /**
     * @dev Completes a circle and distributes insurance + yield
     */
    function _completeCircle(uint256 circleId) internal {
        Circle storage circle = circles[circleId];

        circle.status = CircleStatus.Completed;

        // Distribute yield to insurance pool as bonus
        uint256 yieldEarned = yieldManager.distributeYield(circleId, address(insurancePool));
        if (yieldEarned > 0) {
            insurancePool.addBonusYield(circleId, yieldEarned);
        }

        // Distribute insurance + bonus
        insurancePool.distributeInsurance(circleId, circle.members);

        // Update trust scores for all members
        for (uint256 i = 0; i < circle.members.length; i++) {
            trustScore.recordCircleCompletion(circle.members[i], false);
        }

        emit CircleCompleted(circleId);
    }

    /**
     * @dev Checks if all members have paid for current month
     */
    function _allMembersPaid(uint256 circleId) internal view returns (bool) {
        Circle storage circle = circles[circleId];

        for (uint256 i = 0; i < circle.members.length; i++) {
            if (!circle.monthlyPayments[circle.currentMonth][circle.members[i]]) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Checks if an address is a member of a circle
     */
    function _isCircleMember(uint256 circleId, address user) internal view returns (bool) {
        Circle storage circle = circles[circleId];
        for (uint256 i = 0; i < circle.members.length; i++) {
            if (circle.members[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Returns circle details
     */
    function getCircleDetails(uint256 circleId)
        external
        view
        override
        circleExists(circleId)
        returns (CircleInfo memory)
    {
        Circle storage circle = circles[circleId];

        return CircleInfo({
            circleId: circle.circleId,
            creator: circle.creator,
            contributionAmount: circle.contributionAmount,
            duration: circle.duration,
            maxMembers: circle.maxMembers,
            currentMembers: circle.currentMembers,
            currentMonth: circle.currentMonth,
            status: circle.status,
            requiredTrustScore: circle.requiredTrustScore,
            createdAt: circle.createdAt
        });
    }

    /**
     * @dev Returns all circles a user is part of
     */
    function getUserCircles(address user) external view override returns (uint256[] memory) {
        return userCircles[user];
    }

    /**
     * @dev Returns all circle members
     */
    function getCircleMembers(uint256 circleId)
        external
        view
        override
        circleExists(circleId)
        returns (address[] memory)
    {
        return circles[circleId].members;
    }

    /**
     * @dev Checks if a user has paid for current month
     */
    function hasPaidCurrentMonth(uint256 circleId, address user)
        external
        view
        override
        circleExists(circleId)
        returns (bool)
    {
        Circle storage circle = circles[circleId];
        return circle.monthlyPayments[circle.currentMonth][user];
    }

    /**
     * @dev Returns total number of circles
     */
    function getTotalCircles() external view returns (uint256) {
        return circleCount;
    }

    /**
     * @dev Returns payout queue for a circle
     */
    function getPayoutQueue(uint256 circleId)
        external
        view
        circleExists(circleId)
        returns (address[] memory)
    {
        return circles[circleId].payoutQueue;
    }
}
