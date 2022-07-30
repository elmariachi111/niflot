import { Framework, WrapperSuperToken } from "@superfluid-finance/sdk-core";
import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { preTest } from "./helpers";
import { CfaV1LiquidationPeriodChangedEventsDocument } from "@superfluid-finance/sdk-core/dist/module/subgraph/events/events.generated";

let accounts: SignerWithAddress[];

let admin: SignerWithAddress;
let origin: SignerWithAddress;
let receiver: SignerWithAddress;
let investor: SignerWithAddress;
let operator: SignerWithAddress;

let sf: Framework;
let dai: Contract;
let daix: WrapperSuperToken;
let superSigner;

before(async function () {
  ({ sf, dai, daix } = await preTest());
  [admin, origin, receiver, investor, operator] = await ethers.getSigners();
  //daix = (await sf.loadSuperToken("fDAIx")) as WrapperSuperToken;

  //dai = IERC20__factory.connect(fDAIAddress, admin);
  //let App = await ethers.getContractFactory("TradeableCashflow", admin);

  // TradeableCashflow = await App.deploy(
  //     accounts[1].address,
  //     "TradeableCashflow",
  //     "TCF",
  //     sf.settings.config.hostAddress,
  //     daix.address
  // );
});

beforeEach(async function () {});

describe("sending flows", async function () {
  it("Origins can open streams to receivers", async () => {
    await daix
      .transferFrom({
        amount: ethers.utils.parseEther("1000").toHexString(),
        sender: admin.address,
        receiver: origin.address,
      })
      .exec(admin);

    // const bal = await daix.balanceOf({
    //   account: origin.address,
    //   providerOrSigner: ethers.provider,
    // });

    //expect(bal).to.equal(ethers.utils.parseEther("1000").toString());

    const flowRate = ethers.utils.parseEther("1").div(60);
    const res = await daix
      .createFlow({
        receiver: receiver.address,
        flowRate: flowRate.toHexString(),
      })
      .exec(origin);
  });

  it("receivers can check their stream's state", async function () {
    const flowInfo = await sf.cfaV1.getFlow({
      providerOrSigner: receiver,
      receiver: receiver.address,
      sender: origin.address,
      superToken: daix.address,
    });
    const netFlow = await sf.cfaV1.getNetFlow({
      account: receiver.address,
      providerOrSigner: receiver,
      superToken: daix.address,
    });
    expect(flowInfo.flowRate).to.eq(netFlow);

    const res = await sf.cfaV1
      .deleteFlow({
        receiver: receiver.address,
        sender: origin.address,
        superToken: daix.address,
      })
      .exec(origin);

    const netFlowZero = await sf.cfaV1.getNetFlow({
      account: receiver.address,
      providerOrSigner: receiver,
      superToken: daix.address,
    });
    expect(netFlowZero).to.eq("0");
  });

  it("another account can control streams", async function () {
    const result = await sf.cfaV1
      .updateFlowOperatorPermissions({
        flowOperator: operator.address,
        flowRateAllowance: ethers.utils.parseEther("1500").toString(),
        superToken: daix.address,
        permissions: 7,
      })
      .exec(origin);

    const flowRate = ethers.utils.parseEther("1").div(60);

    const flowRes = await sf.cfaV1
      .createFlowByOperator({
        superToken: daix.address,
        flowRate: flowRate.toHexString(),
        sender: origin.address,
        receiver: receiver.address,
      })
      .exec(operator);

    const netFlow = await sf.cfaV1.getNetFlow({
      account: receiver.address,
      providerOrSigner: receiver,
      superToken: daix.address,
    });
    expect(netFlow).to.eq(flowRate.toString());
    //origin can still modify the flow.
    const newFlowRate = ethers.utils.parseEther("0.5").div(60);
    const res = await sf.cfaV1
      .updateFlow({
        flowRate: newFlowRate.toString(),
        receiver: receiver.address,
        superToken: daix.address,
      })
      .exec(origin);

    const netFlowHalved = await sf.cfaV1.getNetFlow({
      account: receiver.address,
      providerOrSigner: receiver,
      superToken: daix.address,
    });
    expect(netFlowHalved).to.eq(newFlowRate.toString());

    //the operator can close this flow
    const closeRes = await sf.cfaV1
      .deleteFlowByOperator({
        superToken: daix.address,
        sender: origin.address,
        receiver: receiver.address,
      })
      .exec(operator);

    const netFlowZero = await sf.cfaV1.getNetFlow({
      account: receiver.address,
      providerOrSigner: receiver,
      superToken: daix.address,
    });

    expect(netFlowZero).to.eq("0");
  });
});
