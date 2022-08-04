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

beforeEach(async function () {});

describe("Niflot burning scenarios", async function () {
  it("an origin may burn a niflot ahead of time (laydown an employee)", async () => {
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
    await niflot.transferFrom(receiver.address, investor.address, 1);

    ethers.provider.send("evm_increaseTime", [1800]);
    ethers.provider.send("evm_mine", []);

    await expectNetFlowrateEqualsEth(receiver, "0");
    await expectNetFlowrateEqualsEth(investor, "0.01");

    try {
      await niflot.cancelByOrigin(1);
      expect.fail("only origins must be able to cancel a niflot");
    } catch (e: any) {
      expect(e.message).to.contain("only origin can call this");
    }

    niflot = Niflot.connect(origin);
    await niflot.cancelByOrigin(1);

    await expectNetFlowrateEqualsEth(receiver, "0.01");
    await expectNetFlowrateEqualsEth(investor, "0");
  });
});
