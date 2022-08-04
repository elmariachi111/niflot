import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { expect } from "chai";
import { ethers, web3 } from "hardhat";

import daiABI from "../abis/dai.abi.json";
//@ts-ignore
import deployFramework from "@superfluid-finance/ethereum-contracts/scripts/deploy-framework";
//@ts-ignore
import deployTestToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-test-token";
//@ts-ignore
import deploySuperToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-super-token";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { BaseProvider } from "@ethersproject/providers";

const errorHandler = (err: any) => {
  if (err) throw err;
};

export async function preTest(): Promise<{
  sf: Framework;
  dai: Contract;
  daix: WrapperSuperToken;
  expectNetFlowrateEqualsEth: (
    address: string | SignerWithAddress,
    expected: string
  ) => Promise<void>;
}> {
  //get accounts from hardhat
  const accounts = await ethers.getSigners();
  //deploy the framework
  process.env.RESET_SUPERFLUID_FRAMEWORK = "true";
  process.env.RESET_TOKEN = "true";

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
  await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });

  const sf = await Framework.create({
    chainId: 31337,
    provider: ethers,
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: "test",
  });

  // const superSigner = sf.createSigner({
  //   signer: accounts[0],
  //   provider: ethers.provider,
  // });

  //use the framework to get the super token
  const daix = (await sf.loadSuperToken("fDAIx")) as WrapperSuperToken;
  const dai = new ethers.Contract(fDAIAddress, daiABI, accounts[0]);

  await dai
    .connect(accounts[0])
    .mint(accounts[0].address, ethers.utils.parseEther("10000"));

  await dai
    .connect(accounts[0])
    .approve(daix.address, ethers.utils.parseEther("10000"));

  await daix
    .upgrade({
      amount: ethers.utils.parseEther("10000").toHexString(),
    })
    .exec(accounts[0]);

  return {
    sf,
    dai,
    daix,
    expectNetFlowrateEqualsEth: expectNetFlowrateEqualsEth(
      sf,
      daix,
      ethers.provider
    ),
  };
}

const expectNetFlowrateEqualsEth = (
  sf: Framework,
  token: WrapperSuperToken,
  provider: BaseProvider
) => {
  return async (
    address: string | SignerWithAddress,
    expected: string
  ): Promise<void> => {
    const netFlowrate = await sf.cfaV1.getNetFlow({
      superToken: token.address,
      account: typeof address === "string" ? address : address.address,
      providerOrSigner: provider,
    });
    expect(netFlowrate).to.eq(ethers.utils.parseEther(expected).toString());
  };
};
