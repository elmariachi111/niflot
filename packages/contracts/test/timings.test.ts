import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { preTest } from "./helpers";

import { Niflot, Niflot__factory } from "../src/typechain";

let admin: SignerWithAddress;
let origin: SignerWithAddress;
let receiver: SignerWithAddress;
let investor: SignerWithAddress;

let sf: Framework;
let dai: Contract;
let daix: WrapperSuperToken;
let expectNetFlowrateEqualsEth: (
  address: string | SignerWithAddress,
  expected: string
) => Promise<void>;
let Niflot: Niflot;

const receiverFlowRate = ethers.utils.parseEther("0.01");
const colleagueFlowRate = ethers.utils.parseEther("0.003");

before(async function () {
  ({ sf, dai, daix, expectNetFlowrateEqualsEth } = await preTest());
  [admin, origin, receiver, investor] = await ethers.getSigners();

  await daix
    .transferFrom({
      amount: ethers.utils.parseEther("8000").toHexString(),
      sender: admin.address,
      receiver: origin.address,
    })
    .exec(admin);

  const factory = (await ethers.getContractFactory(
    "Niflot"
  )) as Niflot__factory;

  Niflot = await factory.deploy(sf.host.contract.address);

  //permit Niflot contract to handle streams on origin's behalf
  await sf.cfaV1
    .authorizeFlowOperatorWithFullControl({
      flowOperator: Niflot.address,
      superToken: daix.address,
    })
    .exec(origin);
});

describe("Niflots lose value over time", async function () {
  it("initially has 100% value", async () => {
    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: receiverFlowRate.toHexString(),
        receiver: receiver.address,
      })
      .exec(origin);

    await expectNetFlowrateEqualsEth(receiver, "0.01");

    let niflot = Niflot.connect(receiver);
    await niflot.mint(daix.address, origin.address, 3600);
    const [, remainingValue] = await niflot.remainingValue(1);

    expect(remainingValue.toString()).to.eq(
      ethers.utils.parseEther("36").toString()
    );
  });

  it("a niflot's remaining value decreases over time", async () => {
    let niflot = Niflot.connect(receiver);
    await niflot.transferFrom(receiver.address, investor.address, 1);

    ethers.provider.send("evm_increaseTime", [1800]);
    ethers.provider.send("evm_mine", []);

    const [, remainingValue] = await niflot.remainingValue(1);

    //times lead to a certain flakiness, depending on the test chain's state.
    //hence we're using an unsharp comparison here
    expect(remainingValue.lte(ethers.utils.parseEther("18"))).to.be.true;
  });

  it("a niflot's remaining value can't go negative", async () => {
    let niflot = Niflot.connect(investor);
    ethers.provider.send("evm_increaseTime", [3600]);
    ethers.provider.send("evm_mine", []);

    const [, remainingValue] = await niflot.remainingValue(1);

    expect(remainingValue.toString()).to.eq("0");
  });

  it("can ");
});
