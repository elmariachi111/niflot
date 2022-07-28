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
import { preTest } from "./helpers";

let accounts: SignerWithAddress[];

let admin: SignerWithAddress;
let origin: SignerWithAddress;
let receiver: SignerWithAddress;
let investor: SignerWithAddress;

let sf: Framework;
let dai: Contract;
let daix: WrapperSuperToken;
let superSigner;

before(async function () {
  ({ sf, dai, daix } = await preTest());
  [admin, origin, receiver, investor] = await ethers.getSigners();
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

    const bal = await daix.balanceOf({
      account: origin.address,
      providerOrSigner: ethers.provider,
    });

    expect(bal).to.equal(ethers.utils.parseEther("1000").toString());

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
  });
});
