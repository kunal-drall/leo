// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ICircleFactory
 * @dev Interface for the CircleFactory contract
 */
interface ICircleFactory {
    enum CircleStatus {
        Active,
        Completed,
        Defaulted
    }

    struct CircleInfo {
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
    }

    /**
     * @dev Creates a new lending circle
     */
    function createCircle(
        uint256 contributionAmount,
        uint256 duration,
        uint256 maxMembers,
        uint256 requiredTrustScore
    ) external returns (uint256 circleId);

    /**
     * @dev Allows a user to join an existing circle
     */
    function joinCircle(uint256 circleId) external;

    /**
     * @dev Makes a monthly contribution to a circle
     */
    function makeContribution(uint256 circleId) external;

    /**
     * @dev Processes monthly payout for the next recipient
     */
    function processMonthlyPayout(uint256 circleId) external;

    /**
     * @dev Returns circle details
     */
    function getCircleDetails(uint256 circleId) external view returns (CircleInfo memory);

    /**
     * @dev Returns all circles a user is part of
     */
    function getUserCircles(address user) external view returns (uint256[] memory);

    /**
     * @dev Returns all circle members
     */
    function getCircleMembers(uint256 circleId) external view returns (address[] memory);

    /**
     * @dev Checks if a user has paid for current month
     */
    function hasPaidCurrentMonth(uint256 circleId, address user) external view returns (bool);

    /**
     * @dev Emitted when a new circle is created
     */
    event CircleCreated(
        uint256 indexed circleId,
        address indexed creator,
        uint256 contributionAmount,
        uint256 duration,
        uint256 maxMembers
    );

    /**
     * @dev Emitted when a user joins a circle
     */
    event MemberJoined(uint256 indexed circleId, address indexed member);

    /**
     * @dev Emitted when a contribution is made
     */
    event ContributionMade(
        uint256 indexed circleId,
        address indexed member,
        uint256 amount,
        uint256 month
    );

    /**
     * @dev Emitted when a payout is processed
     */
    event PayoutProcessed(
        uint256 indexed circleId,
        address indexed recipient,
        uint256 amount,
        uint256 month
    );

    /**
     * @dev Emitted when a circle is completed
     */
    event CircleCompleted(uint256 indexed circleId);

    /**
     * @dev Emitted when a default is detected
     */
    event DefaultDetected(uint256 indexed circleId, address indexed defaulter, uint256 month);
}
