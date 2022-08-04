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
let Niflot: Niflot;

before(async function () {
  ({ sf, dai, daix } = await preTest());
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
        amount: ethers.utils.parseEther("100").toHexString(),
        sender: admin.address,
        receiver: niflot.address,
      })
      .exec(admin);

    //permit Niflot contract to handle streams on origin's behalf
    await sf.cfaV1
      .authorizeFlowOperatorWithFullControl({
        flowOperator: niflot.address,
        superToken: daix.address,
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

    await niflot.mint(daix.address, origin.address, 3600);

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });
    const flowRate = ethers.utils.parseEther("0.01");
    expect(netFlow).to.eq(flowRate.toString());
  });

  it("another receiver can mint a niflot", async () => {
    //will increase the flowrate from origin to niflot
    const flowRate = ethers.utils.parseEther("0.01");
    await sf.cfaV1
      .createFlow({
        superToken: daix.address,
        flowRate: flowRate.toHexString(),
        receiver: colleague.address,
      })
      .exec(origin);

    let niflot = Niflot.connect(colleague);
    await niflot.mint(daix.address, origin.address, 3600);

    const netFlow = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: colleague.address,
      providerOrSigner: colleague,
    });
    expect(netFlow).to.eq(flowRate.toString());
  });

  it("cannot mint a niflot when one is already active", async () => {
    let niflot = Niflot.connect(receiver);
    try {
      await niflot.mint(daix.address, origin.address, 3600);
      expect.fail("could mint a niflot even though I already received one");
    } catch (e: any) {
      expect(e.message).to.contain("you have invested the full flowrate");
    }
  });

  it("a niflot holder can't mint a niflot of a niflot", async () => {
    let niflot = Niflot.connect(investor);
    try {
      await niflot.mint(daix.address, origin.address, 3600);
      expect.fail("could mint a niflot even though already holding one");
    } catch (e: any) {
      expect(e.message).to.contain("origin isn't streaming to you");
    }
  });

  it("can transfer streams to another recipient by transferring the niflot nft", async () => {
    const niflot = Niflot.connect(receiver);
    await niflot.transferFrom(receiver.address, investor.address, 1);

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

  it("a niflot cannot be sent to the origin", async () => {
    const niflot = Niflot.connect(investor);
    try {
      await niflot.transferFrom(investor.address, origin.address, 1);
      expect.fail("niflots mustn't be transferrable to the origin");
    } catch (e: any) {
      expect(e.message).to.contain("can't transfer a niflot to its origin");
    }
  });

  it("a niflot minter can buy a niflot of a colleague (same origin)", async () => {
    let netFlowColleague = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: colleague.address,
      providerOrSigner: colleague,
    });
    expect(netFlowColleague).to.eq(ethers.utils.parseEther("0.01").toString());

    let niflot = Niflot.connect(investor);
    await niflot.transferFrom(investor.address, colleague.address, 1);

    expect(await niflot.ownerOf(1)).to.eq(colleague.address);
    expect(await niflot.ownerOf(2)).to.eq(colleague.address);

    netFlowColleague = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: colleague.address,
      providerOrSigner: colleague,
    });

    expect(netFlowColleague).to.eq(ethers.utils.parseEther("0.02").toString());

    niflot = Niflot.connect(colleague);

    //colleague has already minted niflot 2, see above
    //todo: test what's happening if he hasn't.
    //await niflot.mint(daix.address, origin.address, 3600);
    expect((await niflot.balanceOf(colleague.address)).toNumber()).to.equal(2);

    //transfer receiver's nft back to the investor
    await niflot.transferFrom(colleague.address, investor.address, 1);

    netFlowColleague = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: colleague.address,
      providerOrSigner: receiver,
    });

    const netFlowInvestor = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: investor.address,
      providerOrSigner: investor,
    });

    expect(netFlowInvestor).to.eq(ethers.utils.parseEther("0.01").toString());
    expect(netFlowColleague).to.eq(ethers.utils.parseEther("0.01").toString());

    const netFlowOrigin = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: origin.address,
      providerOrSigner: origin,
    });
    expect(netFlowOrigin).to.eq(
      "-" + ethers.utils.parseEther("0.02").toString()
    );

    const netFlowNiflotContract = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: niflot.address,
      providerOrSigner: origin,
    });
    //niflot isn't earning anything.
    expect(netFlowNiflotContract).to.eq("0");
  });

  //it.skip("a niflot can be sent to the receiver ahead of time (?)", async () => {});
  it.skip("a niflot can't be transferred after it's mature", async () => {});

  //it.skip("cant be burnt by anyone but the owner", async () => {});

  it.skip("can only be burnt after the agreement time has passed", () => {});

  it("can't burn a non mature niflot", async () => {
    const niflot = Niflot.connect(investor);
    expect(await niflot.isMature(1)).to.be.false;
    try {
      await niflot.burn(1);
      expect.fail("non mature niflots mustnt be burnt");
    } catch (e: any) {
      expect(e.message).to.contain("cant burn a non mature niflot");
    }
  });

  it("becomes mature when time advances", async () => {
    const niflot = Niflot.connect(investor);
    const endsAt = await niflot.endsAt(1);
    let chainTime = (await ethers.provider.getBlock("latest")).timestamp;

    const niflotMatureInSeconds = endsAt.sub(chainTime);
    expect(niflotMatureInSeconds.toNumber()).lt(3600);
    //console.debug("niflot mature in %s seconds", niflotMatureInSeconds);

    //advance blockchain time past maturity date
    ethers.provider.send("evm_increaseTime", [3600]);
    ethers.provider.send("evm_mine", []);

    expect(await niflot.isMature(1)).to.be.true;
  });

  it("burning niflots redirects stream back to their original receiver", async () => {
    const niflot = Niflot.connect(receiver);

    expect(await niflot.ownerOf(1)).to.equal(investor.address);

    //the receiver is burning the niflot, but actually anybody can do so.
    await niflot.burn(1);
    expect((await niflot.balanceOf(investor.address)).toNumber()).to.equal(0);
    expect((await niflot.balanceOf(receiver.address)).toNumber()).to.equal(0);

    const netFlowInvestor = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: investor.address,
      providerOrSigner: receiver,
    });
    expect(netFlowInvestor).to.eq("0");

    const netFlowReceiver = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: receiver.address,
      providerOrSigner: receiver,
    });
    expect(netFlowReceiver).to.eq(ethers.utils.parseEther("0.01").toString());
  });
});
