import { ethers } from "hardhat";

async function main() {
  const Niflot = await ethers.getContractFactory("Niflot");

  const niflot = await Niflot.deploy(process.env.SF_HOST as string);

  console.log("Niflot:", niflot.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
