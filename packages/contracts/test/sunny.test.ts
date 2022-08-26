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

describe("cant mint two niflots of one stream", async function () {
  it("streams to receiver", async () => {
    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: receiverFlowRate.toHexString(),
        receiver: receiver.address,
      })
      .exec(origin);

    await expectNetFlowrateEqualsEth(receiver, "0.01");
  });

  it("receiver mints a niflot that lasts an hour", async () => {
    let niflot = Niflot.connect(receiver);
    await niflot.mint(daix.address, origin.address, 3600);
    const [, remainingValue] = await niflot.remainingValue(1);

    expect(remainingValue.toString()).to.eq(
      ethers.utils.parseEther("36").toString()
    );
  });

  it("receiver sells that niflot to investor", async () => {
    let niflot = Niflot.connect(receiver);
    await niflot.transferFrom(receiver.address, investor.address, 1);

    const niflotOwner = await niflot.ownerOf("1");
    expect(niflotOwner).to.eq(investor.address);
  });

  it("receiver cant mint another niflot", async () => {
    let niflot = Niflot.connect(receiver);
    try {
      await niflot.mint(daix.address, origin.address, 3600);
      expect.fail(
        "users mustnt be able to mint a niflot when they have an active niflot"
      );
    } catch (e: any) {
      expect(e.message).to.contain("origin isn't streaming to you");
    }
  });

  it("investor cant mint a niflot of a niflot based stream", async () => {
    let niflot = Niflot.connect(investor);
    try {
      await niflot.mint(daix.address, origin.address, 3600);
      expect.fail(
        "investors mustnt be able to mint niflots from their niflot streams"
      );
    } catch (e: any) {
      expect(e.message).to.contain("you have invested the full flowrate");
    }
  });
});
