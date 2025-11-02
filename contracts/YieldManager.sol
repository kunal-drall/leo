// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMUSD.sol";

/**
 * @title YieldManager
 * @dev Deploys idle MUSD to DeFi protocols and distributes returns
 *
 * Key Features:
 * - Automatically deploy pooled MUSD to yield strategies
 * - Track earnings per circle
 * - Distribute proportional returns to members
 * - Support multiple yield sources
 */
contract YieldManager is Ownable, ReentrancyGuard {
    IMUSD public musdToken;

    struct YieldStrategy {
        address protocol;
        uint256 totalDeposited;
        uint256 totalEarned;
        bool active;
        string name;
    }

    struct CircleYield {
        uint256 deposited;
        uint256 earned;
        uint256 withdrawn;
        uint256 lastUpdateTime;
        bool active;
    }

    // Authorized contracts (CircleFactory)
    mapping(address => bool) public authorizedContracts;

    // Strategy ID => YieldStrategy
    mapping(uint256 => YieldStrategy) public strategies;
    uint256 public strategyCount;

    // Circle ID => CircleYield
    mapping(uint256 => CircleYield) public circleYields;

    // Default strategy to use
    uint256 public defaultStrategyId;

    // Simulated APY (basis points: 500 = 5%)
    // In production, this would integrate with real DeFi protocols
    uint256 public simulatedAPY = 500; // 5% APY

    event YieldStrategyAdded(uint256 indexed strategyId, address protocol, string name);
    event YieldStrategyUpdated(uint256 indexed strategyId, bool active);
    event FundsDeposited(uint256 indexed circleId, uint256 amount, uint256 strategyId);
    event FundsWithdrawn(uint256 indexed circleId, uint256 amount);
    event YieldDistributed(uint256 indexed circleId, uint256 amount);
    event YieldCalculated(uint256 indexed circleId, uint256 earned);

    modifier onlyAuthorized() {
        require(
            authorizedContracts[msg.sender] || msg.sender == owner(),
            "YieldManager: Not authorized"
        );
        _;
    }

    constructor(address _musdToken) Ownable(msg.sender) {
        require(_musdToken != address(0), "YieldManager: Invalid MUSD address");
        musdToken = IMUSD(_musdToken);

        // Add default "Internal Pool" strategy
        _addYieldStrategy(address(this), "Internal Pool");
        defaultStrategyId = 0;
    }

    /**
     * @dev Authorizes a contract to interact with yield manager
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
     * @dev Adds a new yield strategy
     */
    function addYieldStrategy(address protocol, string memory name) external onlyOwner {
        _addYieldStrategy(protocol, name);
    }

    /**
     * @dev Internal function to add yield strategy
     */
    function _addYieldStrategy(address protocol, string memory name) internal {
        require(protocol != address(0), "YieldManager: Invalid protocol");

        strategies[strategyCount] = YieldStrategy({
            protocol: protocol,
            totalDeposited: 0,
            totalEarned: 0,
            active: true,
            name: name
        });

        emit YieldStrategyAdded(strategyCount, protocol, name);
        strategyCount++;
    }

    /**
     * @dev Updates yield strategy status
     */
    function updateStrategyStatus(uint256 strategyId, bool active) external onlyOwner {
        require(strategyId < strategyCount, "YieldManager: Invalid strategy");
        strategies[strategyId].active = active;
        emit YieldStrategyUpdated(strategyId, active);
    }

    /**
     * @dev Sets the simulated APY (for testnet demo)
     */
    function setSimulatedAPY(uint256 apy) external onlyOwner {
        require(apy <= 10000, "YieldManager: APY too high"); // Max 100%
        simulatedAPY = apy;
    }

    /**
     * @dev Deposits funds to yield strategy
     */
    function depositToYield(
        uint256 circleId,
        uint256 amount
    ) external onlyAuthorized nonReentrant {
        require(amount > 0, "YieldManager: Invalid amount");

        YieldStrategy storage strategy = strategies[defaultStrategyId];
        require(strategy.active, "YieldManager: Strategy not active");

        CircleYield storage circleYield = circleYields[circleId];

        // Transfer MUSD to this contract
        require(
            musdToken.transferFrom(msg.sender, address(this), amount),
            "YieldManager: Transfer failed"
        );

        circleYield.deposited += amount;
        circleYield.active = true;
        circleYield.lastUpdateTime = block.timestamp;

        strategy.totalDeposited += amount;

        emit FundsDeposited(circleId, amount, defaultStrategyId);
    }

    /**
     * @dev Calculates yield earned for a circle
     * Simulates yield based on time elapsed and APY
     */
    function calculateYield(uint256 circleId) public returns (uint256) {
        CircleYield storage circleYield = circleYields[circleId];

        if (!circleYield.active || circleYield.deposited == 0) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp - circleYield.lastUpdateTime;

        // Calculate yield: (amount * APY * timeElapsed) / (365 days * 10000)
        // APY is in basis points (500 = 5%)
        uint256 newYield = (circleYield.deposited * simulatedAPY * timeElapsed) / (365 days * 10000);

        circleYield.earned += newYield;
        circleYield.lastUpdateTime = block.timestamp;

        YieldStrategy storage strategy = strategies[defaultStrategyId];
        strategy.totalEarned += newYield;

        emit YieldCalculated(circleId, newYield);
        return newYield;
    }

    /**
     * @dev Withdraws funds from yield strategy
     */
    function withdrawFromYield(
        uint256 circleId,
        uint256 amount,
        address to
    ) external onlyAuthorized nonReentrant returns (uint256) {
        require(amount > 0, "YieldManager: Invalid amount");
        require(to != address(0), "YieldManager: Invalid address");

        CircleYield storage circleYield = circleYields[circleId];
        require(circleYield.deposited >= amount, "YieldManager: Insufficient balance");

        // Calculate any pending yield before withdrawal
        calculateYield(circleId);

        circleYield.deposited -= amount;
        circleYield.withdrawn += amount;

        YieldStrategy storage strategy = strategies[defaultStrategyId];
        strategy.totalDeposited -= amount;

        require(
            musdToken.transfer(to, amount),
            "YieldManager: Transfer failed"
        );

        emit FundsWithdrawn(circleId, amount);
        return amount;
    }

    /**
     * @dev Distributes earned yield
     */
    function distributeYield(
        uint256 circleId,
        address to
    ) external onlyAuthorized nonReentrant returns (uint256) {
        require(to != address(0), "YieldManager: Invalid address");

        // Calculate latest yield
        calculateYield(circleId);

        CircleYield storage circleYield = circleYields[circleId];
        uint256 yieldToDistribute = circleYield.earned;

        require(yieldToDistribute > 0, "YieldManager: No yield to distribute");

        circleYield.earned = 0;

        // In a real implementation, this would withdraw from actual DeFi protocol
        // For testnet demo, we assume the yield is available
        require(
            musdToken.transfer(to, yieldToDistribute),
            "YieldManager: Distribution failed"
        );

        emit YieldDistributed(circleId, yieldToDistribute);
        return yieldToDistribute;
    }

    /**
     * @dev Returns circle yield information
     */
    function getCircleYield(uint256 circleId) external view returns (
        uint256 deposited,
        uint256 earned,
        uint256 withdrawn,
        uint256 lastUpdateTime,
        bool active
    ) {
        CircleYield storage circleYield = circleYields[circleId];

        // Calculate pending yield without state change
        uint256 pendingYield = 0;
        if (circleYield.active && circleYield.deposited > 0) {
            uint256 timeElapsed = block.timestamp - circleYield.lastUpdateTime;
            pendingYield = (circleYield.deposited * simulatedAPY * timeElapsed) / (365 days * 10000);
        }

        return (
            circleYield.deposited,
            circleYield.earned + pendingYield,
            circleYield.withdrawn,
            circleYield.lastUpdateTime,
            circleYield.active
        );
    }

    /**
     * @dev Returns strategy information
     */
    function getStrategy(uint256 strategyId) external view returns (
        address protocol,
        uint256 totalDeposited,
        uint256 totalEarned,
        bool active,
        string memory name
    ) {
        require(strategyId < strategyCount, "YieldManager: Invalid strategy");
        YieldStrategy storage strategy = strategies[strategyId];
        return (
            strategy.protocol,
            strategy.totalDeposited,
            strategy.totalEarned,
            strategy.active,
            strategy.name
        );
    }

    /**
     * @dev Returns current APY
     */
    function getCurrentAPY() external view returns (uint256) {
        return simulatedAPY;
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "YieldManager: Invalid address");
        require(musdToken.transfer(to, amount), "YieldManager: Transfer failed");
    }
}
