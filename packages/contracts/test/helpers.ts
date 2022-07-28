import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { expect } from "chai";
import { ethers, web3 } from "hardhat";

import daiABI from "./abis/dai.abi.json";
//@ts-ignore
import deployFramework from "@superfluid-finance/ethereum-contracts/scripts/deploy-framework";
//@ts-ignore
import deployTestToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-test-token";
//@ts-ignore
import deploySuperToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-super-token";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";

const errorHandler = (err: any) => {
  if (err) throw err;
};

export async function preTest(): Promise<{
  sf: Framework;
  dai: Contract;
  daix: WrapperSuperToken;
}> {
  //get accounts from hardhat
  const accounts = await ethers.getSigners();
  //deploy the framework
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 token
  let fDAIAddress = await deployTestToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });
  //deploy a fake erc20 wrapper super token around the fDAI token
  let fDAIxAddress = await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });

  const sf = await Framework.create({
    chainId: 31337,
    provider: ethers,
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: "test",
  });

  const superSigner = sf.createSigner({
    signer: accounts[0],
    provider: ethers.provider,
  });

  //use the framework to get the super token
  const daix = (await sf.loadSuperToken("fDAIx")) as WrapperSuperToken;
  const dai = new ethers.Contract(fDAIAddress, daiABI, accounts[0]);

  await dai
    .connect(accounts[0])
    .mint(accounts[0].address, ethers.utils.parseEther("10000"));
  await dai
    .connect(accounts[0])
    .approve(daix.address, ethers.utils.parseEther("10000"));
  const daixUpgradeOperation = daix.upgrade({
    amount: ethers.utils.parseEther("10000").toHexString(),
  });
  await daixUpgradeOperation.exec(accounts[0]);
  const daiBal = await daix.balanceOf({
    account: accounts[0].address,
    providerOrSigner: accounts[0],
  });
  console.log("admin's daix balance: ", daiBal);

  return {
    sf,
    dai,
    daix,
  };
}
