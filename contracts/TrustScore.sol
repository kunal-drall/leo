// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ITrustScore.sol";

/**
 * @title TrustScore
 * @dev Manages user reputation scores for lending circles
 *
 * Trust Score Formula (0-1000 points):
 * - 40% Payment Reliability: (onTimePayments / totalPayments) * 400
 * - 30% Circle Completions: (completedCircles / totalCircles) * 300
 * - 20% DeFi History: Check Mezo protocol interactions * 200
 * - 10% Social Verification: Optional identity proofs * 100
 */
contract TrustScore is ITrustScore, Ownable, ReentrancyGuard {
    struct UserTrust {
        uint256 totalPayments;
        uint256 onTimePayments;
        uint256 latePayments;
        uint256 completedCircles;
        uint256 totalCircles;
        uint256 defaultedCircles;
        uint256 trustScore;
        TrustTier tier;
        uint256 lastUpdated;
    }

    // Trust tier limits in MUSD (monthly contribution)
    uint256 public constant NEWCOMER_MAX = 200 * 10**18;      // $200
    uint256 public constant SILVER_MAX = 500 * 10**18;        // $500
    uint256 public constant GOLD_MAX = 2000 * 10**18;         // $2,000
    // Platinum has no max limit

    // Score thresholds for tiers
    uint256 public constant SILVER_THRESHOLD = 250;
    uint256 public constant GOLD_THRESHOLD = 500;
    uint256 public constant PLATINUM_THRESHOLD = 750;

    // Authorized contracts that can update trust scores
    mapping(address => bool) public authorizedContracts;

    // User trust data
    mapping(address => UserTrust) private userTrustData;

    modifier onlyAuthorized() {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "TrustScore: Not authorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Authorizes a contract to update trust scores
     */
    function authorizeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = true;
    }

    /**
     * @dev Revokes authorization from a contract
     */
    function revokeContract(address contractAddress) external onlyOwner {
        authorizedContracts[contractAddress] = false;
    }

    /**
     * @dev Updates payment record for a user
     */
    function updatePaymentRecord(address user, bool onTime) external override onlyAuthorized {
        UserTrust storage userTrust = userTrustData[user];

        userTrust.totalPayments++;
        if (onTime) {
            userTrust.onTimePayments++;
        } else {
            userTrust.latePayments++;
        }

        calculateTrustScore(user);
        emit PaymentRecorded(user, onTime);
    }

    /**
     * @dev Records circle completion for a user
     */
    function recordCircleCompletion(address user, bool defaulted) external override onlyAuthorized {
        UserTrust storage userTrust = userTrustData[user];

        userTrust.totalCircles++;
        if (defaulted) {
            userTrust.defaultedCircles++;
            // Heavy penalty for defaults: reduce score by 200 points
            if (userTrust.trustScore >= 200) {
                userTrust.trustScore -= 200;
            } else {
                userTrust.trustScore = 0;
            }
        } else {
            userTrust.completedCircles++;
        }

        calculateTrustScore(user);
        emit CircleCompletionRecorded(user, defaulted);
    }

    /**
     * @dev Calculates and updates trust score for a user
     * Formula:
     * - 40% Payment Reliability
     * - 30% Circle Completions
     * - 20% DeFi History (placeholder for now)
     * - 10% Social Verification (placeholder for now)
     */
    function calculateTrustScore(address user) public override returns (uint256) {
        UserTrust storage userTrust = userTrustData[user];

        uint256 paymentScore = 0;
        uint256 completionScore = 0;
        uint256 defiScore = 0; // Placeholder: can integrate with Mezo protocol data
        uint256 socialScore = 0; // Placeholder: can integrate with identity verification

        // Payment Reliability (40% = 400 points max)
        if (userTrust.totalPayments > 0) {
            paymentScore = (userTrust.onTimePayments * 400) / userTrust.totalPayments;
        }

        // Circle Completions (30% = 300 points max)
        if (userTrust.totalCircles > 0) {
            completionScore = (userTrust.completedCircles * 300) / userTrust.totalCircles;
        }

        // DeFi History (20% = 200 points max) - simplified for now
        // In production, this would check interactions with Mezo protocols
        if (userTrust.totalPayments > 10) {
            defiScore = 100; // Basic activity bonus
        }
        if (userTrust.totalPayments > 50) {
            defiScore = 200; // High activity bonus
        }

        // Social Verification (10% = 100 points max) - placeholder
        // Can be expanded to include KYC, social proofs, etc.

        uint256 newScore = paymentScore + completionScore + defiScore + socialScore;

        // Cap at 1000
        if (newScore > 1000) {
            newScore = 1000;
        }

        userTrust.trustScore = newScore;
        userTrust.tier = _calculateTier(newScore);
        userTrust.lastUpdated = block.timestamp;

        emit TrustScoreUpdated(user, newScore, userTrust.tier);
        return newScore;
    }

    /**
     * @dev Internal function to calculate tier from score
     */
    function _calculateTier(uint256 score) internal pure returns (TrustTier) {
        if (score >= PLATINUM_THRESHOLD) return TrustTier.Platinum;
        if (score >= GOLD_THRESHOLD) return TrustTier.Gold;
        if (score >= SILVER_THRESHOLD) return TrustTier.Silver;
        return TrustTier.Newcomer;
    }

    /**
     * @dev Returns the trust score for a user
     */
    function getTrustScore(address user) external view override returns (uint256) {
        return userTrustData[user].trustScore;
    }

    /**
     * @dev Returns the trust tier for a user
     */
    function getTrustTier(address user) external view override returns (TrustTier) {
        return userTrustData[user].tier;
    }

    /**
     * @dev Checks if a user can join a circle based on contribution amount
     */
    function canJoinCircle(address user, uint256 contributionAmount) external view override returns (bool) {
        TrustTier tier = userTrustData[user].tier;

        if (tier == TrustTier.Newcomer) {
            return contributionAmount <= NEWCOMER_MAX;
        } else if (tier == TrustTier.Silver) {
            return contributionAmount <= SILVER_MAX;
        } else if (tier == TrustTier.Gold) {
            return contributionAmount <= GOLD_MAX;
        } else {
            // Platinum has no limit
            return true;
        }
    }

    /**
     * @dev Returns detailed trust metrics for a user
     */
    function getUserTrustMetrics(address user) external view override returns (
        uint256 totalPayments,
        uint256 onTimePayments,
        uint256 latePayments,
        uint256 completedCircles,
        uint256 totalCircles,
        uint256 defaultedCircles,
        uint256 trustScore,
        TrustTier tier
    ) {
        UserTrust storage userTrust = userTrustData[user];
        return (
            userTrust.totalPayments,
            userTrust.onTimePayments,
            userTrust.latePayments,
            userTrust.completedCircles,
            userTrust.totalCircles,
            userTrust.defaultedCircles,
            userTrust.trustScore,
            userTrust.tier
        );
    }

    /**
     * @dev Returns the maximum contribution amount for a tier
     */
    function getTierMaxContribution(TrustTier tier) external pure returns (uint256) {
        if (tier == TrustTier.Newcomer) return NEWCOMER_MAX;
        if (tier == TrustTier.Silver) return SILVER_MAX;
        if (tier == TrustTier.Gold) return GOLD_MAX;
        return type(uint256).max; // Platinum
    }
}
