// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMUSD
 * @dev Mock MUSD token for testing purposes
 * This simulates the Mezo MUSD stablecoin
 */
contract MockMUSD is ERC20, Ownable {
    constructor() ERC20("Mock MUSD", "MUSD") Ownable(msg.sender) {
        // Mint initial supply for testing (10 million MUSD)
        _mint(msg.sender, 10_000_000 * 10**18);
    }

    /**
     * @dev Mints new tokens (for testing)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function for testing - anyone can get 10,000 MUSD
     */
    function faucet() external {
        _mint(msg.sender, 10_000 * 10**18);
    }

    /**
     * @dev Burns tokens
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
