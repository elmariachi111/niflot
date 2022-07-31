import { config as dotenv } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-web3";

dotenv();

const config: HardhatUserConfig = {
  networks: {},
  solidity: "0.8.15",
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
