// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMUSD.sol";

/**
 * @title InsurancePool
 * @dev Manages insurance stakes and covers defaults in lending circles
 *
 * Key Features:
 * - Members stake 10-20% of contribution as insurance
 * - Insurance pool covers defaults automatically
 * - Penalty enforcement for defaulters
 * - Refund insurance + bonus for good actors at completion
 */
contract InsurancePool is Ownable, ReentrancyGuard {
    IMUSD public musdToken;

    struct Insurance {
        uint256 circleId;
        uint256 totalPool;
        uint256 claimsProcessed;
        uint256 bonusPool; // Extra yield allocated for bonuses
        bool distributed;
        mapping(address => uint256) stakes;
        mapping(address => bool) hasWithdrawn;
    }

    // Insurance percentage range (10-20%)
    uint256 public constant MIN_INSURANCE_PERCENT = 10;
    uint256 public constant MAX_INSURANCE_PERCENT = 20;
    uint256 public defaultInsurancePercent = 15; // Default 15%

    // Bonus percentage for completing circle (from yield)
    uint256 public constant COMPLETION_BONUS_PERCENT = 5; // 5% bonus

    // Authorized contracts (CircleFactory)
    mapping(address => bool) public authorizedContracts;

    // Circle ID => Insurance data
    mapping(uint256 => Insurance) private insurances;

    // Track defaulters to prevent re-entry
    mapping(address => bool) public isDefaulter;

    event InsuranceDeposited(uint256 indexed circleId, address indexed member, uint256 amount);
    event DefaultClaimed(uint256 indexed circleId, address indexed defaulter, uint256 amount);
    event InsuranceDistributed(uint256 indexed circleId, address indexed member, uint256 amount);
    event BonusAdded(uint256 indexed circleId, uint256 amount);

    modifier onlyAuthorized() {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "InsurancePool: Not authorized"
        );
        _;
    }

    constructor(address _musdToken) Ownable(msg.sender) {
        require(_musdToken != address(0), "InsurancePool: Invalid MUSD address");
        musdToken = IMUSD(_musdToken);
    }

    /**
     * @dev Authorizes a contract to interact with insurance pool
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
     * @dev Sets the default insurance percentage
     */
    function setDefaultInsurancePercent(uint256 percent) external onlyOwner {
        require(
            percent >= MIN_INSURANCE_PERCENT && percent <= MAX_INSURANCE_PERCENT,
            "InsurancePool: Invalid percentage"
        );
        defaultInsurancePercent = percent;
    }

    /**
     * @dev Deposits insurance stake for a circle member
     */
    function depositInsurance(
        uint256 circleId,
        address member,
        uint256 contributionAmount
    ) external onlyAuthorized nonReentrant {
        require(!isDefaulter[member], "InsurancePool: Member is a defaulter");

        uint256 insuranceAmount = (contributionAmount * defaultInsurancePercent) / 100;

        Insurance storage insurance = insurances[circleId];
        insurance.circleId = circleId;
        insurance.stakes[member] = insuranceAmount;
        insurance.totalPool += insuranceAmount;

        // Transfer MUSD from member to this contract
        require(
            musdToken.transferFrom(member, address(this), insuranceAmount),
            "InsurancePool: Transfer failed"
        );

        emit InsuranceDeposited(circleId, member, insuranceAmount);
    }

    /**
     * @dev Processes a default claim and covers from insurance pool
     */
    function processDefaultClaim(
        uint256 circleId,
        address defaulter,
        uint256 missedAmount
    ) external onlyAuthorized nonReentrant returns (bool) {
        Insurance storage insurance = insurances[circleId];

        require(!insurance.distributed, "InsurancePool: Already distributed");
        require(insurance.totalPool >= missedAmount, "InsurancePool: Insufficient pool");

        // Mark as defaulter
        isDefaulter[defaulter] = true;

        // Deduct from pool
        insurance.totalPool -= missedAmount;
        insurance.claimsProcessed += missedAmount;

        // Defaulter loses their stake (it remains in pool for others)
        insurance.stakes[defaulter] = 0;

        emit DefaultClaimed(circleId, defaulter, missedAmount);
        return true;
    }

    /**
     * @dev Adds bonus yield to insurance pool
     */
    function addBonusYield(uint256 circleId, uint256 amount) external onlyAuthorized nonReentrant {
        Insurance storage insurance = insurances[circleId];
        insurance.bonusPool += amount;

        require(
            musdToken.transferFrom(msg.sender, address(this), amount),
            "InsurancePool: Bonus transfer failed"
        );

        emit BonusAdded(circleId, amount);
    }

    /**
     * @dev Distributes insurance + bonus to members at circle completion
     */
    function distributeInsurance(
        uint256 circleId,
        address[] calldata members
    ) external onlyAuthorized nonReentrant {
        Insurance storage insurance = insurances[circleId];

        require(!insurance.distributed, "InsurancePool: Already distributed");
        require(members.length > 0, "InsurancePool: No members");

        uint256 bonusPerMember = insurance.bonusPool / members.length;

        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];

            // Skip defaulters
            if (isDefaulter[member]) continue;

            uint256 stake = insurance.stakes[member];
            if (stake > 0 && !insurance.hasWithdrawn[member]) {
                uint256 totalReturn = stake + bonusPerMember;

                insurance.hasWithdrawn[member] = true;

                require(
                    musdToken.transfer(member, totalReturn),
                    "InsurancePool: Distribution failed"
                );

                emit InsuranceDistributed(circleId, member, totalReturn);
            }
        }

        insurance.distributed = true;
    }

    /**
     * @dev Returns insurance stake for a specific member
     */
    function getInsuranceStake(uint256 circleId, address member) external view returns (uint256) {
        return insurances[circleId].stakes[member];
    }

    /**
     * @dev Returns total pool balance for a circle
     */
    function getPoolBalance(uint256 circleId) external view returns (uint256) {
        return insurances[circleId].totalPool;
    }

    /**
     * @dev Returns insurance details for a circle
     */
    function getInsuranceDetails(uint256 circleId) external view returns (
        uint256 totalPool,
        uint256 claimsProcessed,
        uint256 bonusPool,
        bool distributed
    ) {
        Insurance storage insurance = insurances[circleId];
        return (
            insurance.totalPool,
            insurance.claimsProcessed,
            insurance.bonusPool,
            insurance.distributed
        );
    }

    /**
     * @dev Checks if a member has withdrawn insurance
     */
    function hasWithdrawn(uint256 circleId, address member) external view returns (bool) {
        return insurances[circleId].hasWithdrawn[member];
    }

    /**
     * @dev Emergency withdrawal (only owner, for safety)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "InsurancePool: Invalid address");
        require(musdToken.transfer(to, amount), "InsurancePool: Transfer failed");
    }
}
