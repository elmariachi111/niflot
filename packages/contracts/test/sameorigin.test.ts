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
let colleague: SignerWithAddress;

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
  [admin, origin, receiver, investor, colleague] = await ethers.getSigners();

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

beforeEach(async function () {});

describe("niflot same origin cases", async function () {
  it("create 2 streams to colleagues", async () => {
    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: receiverFlowRate.toHexString(),
        receiver: receiver.address,
      })
      .exec(origin);

    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: colleagueFlowRate.toHexString(),
        receiver: colleague.address,
      })
      .exec(origin);

    await expectNetFlowrateEqualsEth(receiver, "0.01");
    await expectNetFlowrateEqualsEth(colleague, "0.003");
  });

  it("receiver creates niflot and sells to investor", async () => {
    let niflot = Niflot.connect(receiver);
    await niflot.mint(daix.address, origin.address, 3600);

    niflot = Niflot.connect(receiver);
    await niflot.transferFrom(receiver.address, investor.address, 1);

    await expectNetFlowrateEqualsEth(investor, "0.01");
  });

  it("investor cannot mint another niflot", async () => {
    let niflot = Niflot.connect(investor);
    try {
      await niflot.mint(daix.address, origin.address, 3600);
      expect.fail("investors may not mint a niflot of their niflots");
    } catch (e: any) {
      expect(e.message).to.contain("you have invested the full flowrate");
    }
  });

  it("investor sells receiver's niflot to colleague", async () => {
    let niflot = Niflot.connect(investor);
    await niflot.transferFrom(investor.address, colleague.address, 1);

    await expectNetFlowrateEqualsEth(colleague, "0.013");
    await expectNetFlowrateEqualsEth(investor, "0");
  });

  it("colleague can mint a niflot worth his own salary", async () => {
    let niflot = Niflot.connect(colleague);
    await niflot.mint(daix.address, origin.address, 3600);

    const colleagueNiflotData = await niflot.getNiflotData(2);

    expect(colleagueNiflotData.flowrate.toString()).to.equal(
      colleagueFlowRate.toString()
    );

    await expectNetFlowrateEqualsEth(colleague, "0.013");
  });

  it("colleague sells his niflot to investor", async () => {
    let niflot = Niflot.connect(colleague);
    await niflot.transferFrom(colleague.address, investor.address, 2);

    await expectNetFlowrateEqualsEth(investor, "0.003");
    await expectNetFlowrateEqualsEth(colleague, "0.01");
  });

  it("colleague sells receiver's niflot to investor", async () => {
    let niflot = Niflot.connect(colleague);
    await niflot.transferFrom(colleague.address, investor.address, 1);

    await expectNetFlowrateEqualsEth(investor, "0.013");
    await expectNetFlowrateEqualsEth(colleague, "0");
  });

  it("no one can mint another niflot", async () => {
    try {
      await Niflot.connect(investor).mint(daix.address, origin.address, 3600);
      expect.fail("investors may not mint a niflot of their niflots");
    } catch (e: any) {
      expect(e.message).to.contain("you have invested the full flowrate");
    }

    try {
      await Niflot.connect(receiver).mint(daix.address, origin.address, 3600);
      expect.fail("receiver mustn't mint a niflot of their colleague's income");
    } catch (e: any) {
      expect(e.message).to.contain("origin isn't streaming to you");
    }

    try {
      await Niflot.connect(colleague).mint(daix.address, origin.address, 3600);
      expect.fail("colleague mustn't mint a niflot of the receiver's income");
    } catch (e: any) {
      expect(e.message).to.contain("origin isn't streaming to you");
    }
  });
});
