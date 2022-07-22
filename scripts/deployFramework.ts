//@ts-ignore
import hre, { ethers, web3 } from "hardhat";

//@ts-ignore
import deployFramework from "@superfluid-finance/ethereum-contracts/scripts/deploy-framework";
//@ts-ignore
import deployTestToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-test-token";
//@ts-ignore
import deploySuperToken from "@superfluid-finance/ethereum-contracts/scripts/deploy-super-token";

const errorHandler = (err: any) => {
  if (err) throw err;
};

async function main() {
  const [admin] = await ethers.getSigners();

  const fwResult = await deployFramework(errorHandler, {
    web3,
    from: admin.address,
  });
  const fDAI = await deployTestToken(errorHandler, [":", "fDAI"], {
    web3,
    from: admin.address,
  });
  const fDAIx = await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: admin.address,
  });

  console.log(fwResult, process.env.RESOLVER_ADDRESS, fDAI, fDAIx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
