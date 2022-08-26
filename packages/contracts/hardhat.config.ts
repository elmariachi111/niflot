import { config as dotenv } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";

dotenv();

const config: HardhatUserConfig = {
  networks: {
    dashboard: {
      url: "http://localhost:24012/rpc",
    },
  },
  solidity: "0.8.15",
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_KEY || "",
  },
  typechain: {
    outDir: "src/typechain",
    target: "ethers-v5",
    //alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    //externalArtifacts: ['externalArtifacts/*.json'], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
    //dontOverrideCompile: false // defaults to false
  },
  // mocha: {
  //   require: ["ts-node/register"],
  //   rootHooks: mochaRootHooks,
  // },
};

export default config;
