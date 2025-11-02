// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITrustScore
 * @dev Interface for the TrustScore contract
 */
interface ITrustScore {
    enum TrustTier {
        Newcomer,  // 0-249: $50-200/month circles
        Silver,    // 250-499: Up to $500/month
        Gold,      // 500-749: Up to $2,000/month
        Platinum   // 750-1000: Premium circles + governance
    }

    /**
     * @dev Returns the trust score for a user (0-1000)
     */
    function getTrustScore(address user) external view returns (uint256);

    /**
     * @dev Returns the trust tier for a user
     */
    function getTrustTier(address user) external view returns (TrustTier);

    /**
     * @dev Checks if a user can join a circle based on contribution amount
     */
    function canJoinCircle(address user, uint256 contributionAmount) external view returns (bool);

    /**
     * @dev Updates payment record for a user
     */
    function updatePaymentRecord(address user, bool onTime) external;

    /**
     * @dev Records circle completion for a user
     */
    function recordCircleCompletion(address user, bool defaulted) external;

    /**
     * @dev Calculates and updates trust score for a user
     */
    function calculateTrustScore(address user) external returns (uint256);

    /**
     * @dev Returns detailed trust metrics for a user
     */
    function getUserTrustMetrics(address user) external view returns (
        uint256 totalPayments,
        uint256 onTimePayments,
        uint256 latePayments,
        uint256 completedCircles,
        uint256 totalCircles,
        uint256 defaultedCircles,
        uint256 trustScore,
        TrustTier tier
    );

    /**
     * @dev Emitted when a user's trust score is updated
     */
    event TrustScoreUpdated(address indexed user, uint256 newScore, TrustTier newTier);

    /**
     * @dev Emitted when a payment is recorded
     */
    event PaymentRecorded(address indexed user, bool onTime);

    /**
     * @dev Emitted when a circle completion is recorded
     */
    event CircleCompletionRecorded(address indexed user, bool defaulted);
}
