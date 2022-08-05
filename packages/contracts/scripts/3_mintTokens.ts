import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { ethers } from "hardhat";
import daiABI from "../abis/dai.abi.json";

let origin;

async function main() {
  const accounts = await ethers.getSigners();
  origin = accounts[19];

  const dai = new ethers.Contract(
    process.env.SF_DAI as string,
    daiABI,
    accounts[0]
  );

  await dai.mint(origin.address, ethers.utils.parseEther("10000"));

  const sf = await Framework.create({
    provider: ethers.provider,
    chainId: 31337,
    resolverAddress: process.env.SF_RESOLVER,
    protocolReleaseVersion: "test",
  });
  const daix = (await sf.loadSuperToken("fDAIx")) as WrapperSuperToken;

  await dai
    .connect(origin)
    .approve(daix.address, ethers.utils.parseEther("10000"));

  const daixUpgradeOperation = daix.upgrade({
    amount: ethers.utils.parseEther("10000").toString(),
  });

  await daixUpgradeOperation.exec(origin);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
