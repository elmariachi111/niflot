import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { preTest } from "./helpers";
import { CfaV1LiquidationPeriodChangedEventsDocument } from "@superfluid-finance/sdk-core/dist/module/subgraph/events/events.generated";
import { Niflot, Niflot__factory } from "../src/typechain";

let accounts: SignerWithAddress[];

let admin: SignerWithAddress;
let origin: SignerWithAddress;
let receiver: SignerWithAddress;
let investor: SignerWithAddress;

let sf: Framework;
let dai: Contract;
let daix: WrapperSuperToken;
let Niflot: Niflot;

before(async function () {
  ({ sf, dai, daix } = await preTest());
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

  //add some initial money for deposits
  await daix
    .transferFrom({
      amount: ethers.utils.parseEther("37").toHexString(),
      sender: admin.address,
      receiver: receiver.address,
    })
    .exec(admin);
});

beforeEach(async function () {});

describe("niflot", async function () {
  it("Origins can allow niflot to manage streams", async () => {
    let niflot = Niflot.connect(origin);
    //add some initial money for deposits
    await daix
      .transferFrom({
        amount: ethers.utils.parseEther("37").toHexString(),
        sender: admin.address,
        receiver: niflot.address,
      })
      .exec(admin);

    //permit Niflot contract to handle streams on origin's behalf
    await sf.cfaV1
      .updateFlowOperatorPermissions({
        flowOperator: niflot.address,
        flowRateAllowance: ethers.utils.parseEther("1500").toString(),
        superToken: daix.address,
        permissions: 7,
      })
      .exec(origin);

    //initialize original payment stream
    const flowRate = ethers.utils.parseEther("0.01");

    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: flowRate.toHexString(),
        receiver: receiver.address,
      })
      .exec(origin);

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });

    expect(netFlow).to.eq(flowRate.toString());
  });

  it("can create an initial niflot that points to the original receiver", async () => {
    let niflot = Niflot.connect(receiver);

    await niflot.mint(daix.address, origin.address);

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });
    const flowRate = ethers.utils.parseEther("0.01");
    expect(netFlow).to.eq(flowRate.toString());
  });

  it("can transfer streams to another recipient by transferring the niflot nft", async () => {
    const niflot = Niflot.connect(receiver);
    const tokenId = 1;
    await niflot.transferFrom(receiver.address, investor.address, tokenId);

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });
    expect(netFlow).to.eq("0");

    const netFlowInvestor = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: investor.address,
      providerOrSigner: receiver,
    });

    const flowRate = ethers.utils.parseEther("0.01");
    expect(netFlowInvestor).to.eq(flowRate.toString());
  });

  it.skip("cant be burnt by anyone but the owner", async () => {});

  it.skip("can only be burnt after the agreement time has passed", () => {});

  it("burning niflots redirects stream back to their original receiver", async () => {
    const niflot = Niflot.connect(investor);
    const tokenId = 1;
    await niflot.burn(tokenId);

    const flowRate = ethers.utils.parseEther("0.01");

    const netFlowInvestor = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: investor.address,
      providerOrSigner: receiver,
    });
    expect(netFlowInvestor).to.eq("0");

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });
    expect(netFlow).to.eq(flowRate.toString());
  });
});
