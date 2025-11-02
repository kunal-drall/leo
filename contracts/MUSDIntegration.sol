// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IMUSD.sol";

/**
 * @title MUSDIntegration
 * @dev Handles MUSD minting from BTC collateral and interactions
 *
 * Note: This is a simplified version for testnet demonstration.
 * In production, this would integrate with Mezo's actual BTC collateral system.
 *
 * Key Features:
 * - Interface with Mezo's MUSD contract
 * - Track BTC collateral positions
 * - Monitor collateralization ratios
 * - Alert before liquidation risk
 * - Handle MUSD transfers
 */
contract MUSDIntegration is Ownable, ReentrancyGuard {
    IMUSD public musdToken;

    struct CollateralPosition {
        uint256 btcDeposited;      // Amount of BTC deposited (in wei)
        uint256 musdMinted;        // Amount of MUSD minted
        uint256 lastUpdateTime;    // Last time position was updated
        bool active;               // Is position active
    }

    // Collateralization parameters
    uint256 public constant MIN_COLLATERAL_RATIO = 150; // 150% minimum
    uint256 public constant LIQUIDATION_RATIO = 130;    // 130% liquidation threshold
    uint256 public constant SAFE_RATIO = 200;           // 200% recommended safe ratio
    uint256 public constant BORROWING_RATE = 100;       // 1% borrowing rate (basis points)

    // BTC price oracle (simplified for testnet)
    // In production, this would use Chainlink or similar oracle
    uint256 public btcPriceUSD = 50000 * 10**18; // $50,000 per BTC

    // User collateral positions
    mapping(address => CollateralPosition) public positions;

    // Total statistics
    uint256 public totalBTCDeposited;
    uint256 public totalMUSDMinted;

    event BTCDeposited(address indexed user, uint256 amount);
    event MUSDMinted(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event PositionLiquidated(address indexed user, uint256 btcAmount, uint256 musdDebt);
    event BTCPriceUpdated(uint256 newPrice);

    constructor(address _musdToken) Ownable(msg.sender) {
        require(_musdToken != address(0), "MUSDIntegration: Invalid MUSD address");
        musdToken = IMUSD(_musdToken);
    }

    /**
     * @dev Deposits BTC as collateral and mints MUSD
     * For testnet demo, we accept ETH as proxy for BTC
     */
    function depositBTCAndMint(uint256 musdAmount) external payable nonReentrant {
        require(msg.value > 0, "MUSDIntegration: No BTC deposited");
        require(musdAmount > 0, "MUSDIntegration: Invalid MUSD amount");

        CollateralPosition storage position = positions[msg.sender];

        // Calculate collateral value in USD
        uint256 collateralValueUSD = (msg.value * btcPriceUSD) / 10**18;

        // Calculate required collateral for MUSD amount
        uint256 requiredCollateral = (musdAmount * MIN_COLLATERAL_RATIO) / 100;

        require(
            collateralValueUSD >= requiredCollateral,
            "MUSDIntegration: Insufficient collateral"
        );

        // Update position
        position.btcDeposited += msg.value;
        position.musdMinted += musdAmount;
        position.lastUpdateTime = block.timestamp;
        position.active = true;

        // Update totals
        totalBTCDeposited += msg.value;
        totalMUSDMinted += musdAmount;

        // In production, this would call Mezo's MUSD minting function
        // For testnet, we assume MUSD is transferred to user
        // require(musdToken.transfer(msg.sender, musdAmount), "MUSDIntegration: Mint failed");

        emit BTCDeposited(msg.sender, msg.value);
        emit MUSDMinted(msg.sender, musdAmount);
    }

    /**
     * @dev Adds more BTC collateral to position
     */
    function addCollateral() external payable nonReentrant {
        require(msg.value > 0, "MUSDIntegration: No BTC deposited");

        CollateralPosition storage position = positions[msg.sender];
        require(position.active, "MUSDIntegration: No active position");

        position.btcDeposited += msg.value;
        position.lastUpdateTime = block.timestamp;

        totalBTCDeposited += msg.value;

        emit BTCDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Withdraws BTC collateral (if safe)
     */
    function withdrawCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "MUSDIntegration: Invalid amount");

        CollateralPosition storage position = positions[msg.sender];
        require(position.active, "MUSDIntegration: No active position");
        require(position.btcDeposited >= amount, "MUSDIntegration: Insufficient collateral");

        // Calculate new collateral ratio after withdrawal
        uint256 newCollateral = position.btcDeposited - amount;
        uint256 newCollateralValueUSD = (newCollateral * btcPriceUSD) / 10**18;
        uint256 currentRatio = (newCollateralValueUSD * 100) / position.musdMinted;

        require(
            currentRatio >= MIN_COLLATERAL_RATIO,
            "MUSDIntegration: Would breach min collateral ratio"
        );

        position.btcDeposited -= amount;
        position.lastUpdateTime = block.timestamp;

        totalBTCDeposited -= amount;

        // Transfer BTC back to user
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "MUSDIntegration: Transfer failed");

        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Returns MUSD balance of an address
     */
    function getMUSDBalance(address user) external view returns (uint256) {
        return musdToken.balanceOf(user);
    }

    /**
     * @dev Returns collateralization ratio for a user
     */
    function getCollateralRatio(address user) external view returns (uint256) {
        CollateralPosition storage position = positions[user];

        if (!position.active || position.musdMinted == 0) {
            return 0;
        }

        uint256 collateralValueUSD = (position.btcDeposited * btcPriceUSD) / 10**18;
        return (collateralValueUSD * 100) / position.musdMinted;
    }

    /**
     * @dev Transfers MUSD to another address
     */
    function transferMUSD(address to, uint256 amount) external returns (bool) {
        return musdToken.transferFrom(msg.sender, to, amount);
    }

    /**
     * @dev Returns collateral position details
     */
    function getPosition(address user) external view returns (
        uint256 btcDeposited,
        uint256 musdMinted,
        uint256 collateralRatio,
        uint256 liquidationPrice,
        bool active
    ) {
        CollateralPosition storage position = positions[user];

        uint256 ratio = 0;
        uint256 liqPrice = 0;

        if (position.active && position.musdMinted > 0) {
            uint256 collateralValueUSD = (position.btcDeposited * btcPriceUSD) / 10**18;
            ratio = (collateralValueUSD * 100) / position.musdMinted;

            // Calculate BTC price at which position would be liquidated
            liqPrice = (position.musdMinted * LIQUIDATION_RATIO * 10**18) / (position.btcDeposited * 100);
        }

        return (
            position.btcDeposited,
            position.musdMinted,
            ratio,
            liqPrice,
            position.active
        );
    }

    /**
     * @dev Checks if a position is at risk of liquidation
     */
    function isAtRisk(address user) external view returns (bool) {
        CollateralPosition storage position = positions[user];

        if (!position.active || position.musdMinted == 0) {
            return false;
        }

        uint256 collateralValueUSD = (position.btcDeposited * btcPriceUSD) / 10**18;
        uint256 ratio = (collateralValueUSD * 100) / position.musdMinted;

        return ratio <= LIQUIDATION_RATIO;
    }

    /**
     * @dev Updates BTC price (only owner - would be oracle in production)
     */
    function updateBTCPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "MUSDIntegration: Invalid price");
        btcPriceUSD = newPrice;
        emit BTCPriceUpdated(newPrice);
    }

    /**
     * @dev Returns current BTC price
     */
    function getBTCPrice() external view returns (uint256) {
        return btcPriceUSD;
    }

    /**
     * @dev Returns borrowing rate
     */
    function getBorrowingRate() external pure returns (uint256) {
        return BORROWING_RATE;
    }

    /**
     * @dev Returns health metrics
     */
    function getHealthMetrics(address user) external view returns (
        bool isHealthy,
        bool isAtRisk,
        bool needsAction,
        uint256 currentRatio,
        uint256 safeRatio
    ) {
        CollateralPosition storage position = positions[user];

        if (!position.active || position.musdMinted == 0) {
            return (true, false, false, 0, SAFE_RATIO);
        }

        uint256 collateralValueUSD = (position.btcDeposited * btcPriceUSD) / 10**18;
        uint256 ratio = (collateralValueUSD * 100) / position.musdMinted;

        bool healthy = ratio >= SAFE_RATIO;
        bool atRisk = ratio <= LIQUIDATION_RATIO;
        bool action = ratio < SAFE_RATIO && ratio > LIQUIDATION_RATIO;

        return (healthy, atRisk, action, ratio, SAFE_RATIO);
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "MUSDIntegration: Withdrawal failed");
    }

    /**
     * @dev Receive function to accept BTC/ETH
     */
    receive() external payable {
        emit BTCDeposited(msg.sender, msg.value);
    }
}
