require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    mezoTestnet: {
      url: process.env.MEZO_TESTNET_RPC_URL || "https://testnet-rpc.mezo.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.MEZO_TESTNET_CHAIN_ID || "686868"),
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      mezoTestnet: process.env.MEZO_API_KEY || "your-api-key",
    },
    customChains: [
      {
        network: "mezoTestnet",
        chainId: parseInt(process.env.MEZO_TESTNET_CHAIN_ID || "686868"),
        urls: {
          apiURL: process.env.MEZO_EXPLORER_API_URL || "https://explorer-api.mezo.org",
          browserURL: process.env.MEZO_EXPLORER_URL || "https://explorer.mezo.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
