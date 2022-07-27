# Niflot

npx hardhat node
npx hardhat run --network localhost scripts/deployFramework.ts
npx hardhat typechain

superfluid/packages/ethereum-contracts
npm run run-truffle compile

superfluid/packages/subgraph
npm run prepare-local
npm run set-network-local
npm run getAbi
npm run generate-sf-meta-local

Resolver at 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Superfluid Loader v1 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
Loading framework with release version test
Superfluid host contract: TruffleContract .host 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
SuperTokenFactory address: 0x80E2E2367C5E9D070Ae2d6d50bF0cdF6360a7151
ConstantFlowAgreementV1: TruffleContract .agreements.cfa | Helper .cfa 0x9bd03768a7DCc129555dE410FF8E85528A4F88b5
InstantDistributionAgreementV1: TruffleContract .agreements.ida | Helper .ida 0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1
Superfluid Framework initialized.
Underlying token symbol fDAI
Underlying token address 0x59b670e9fA9D0A427751Af201D676719a970857b
Underlying token address 0x59b670e9fA9D0A427751Af201D676719a970857b
Underlying token info name() fDAI Fake Token
Underlying token info symbol() fDAI
Underlying token info decimals() 18
SuperToken key at the resolver: supertokens.test.fDAIx
SuperToken address: 0x0000000000000000000000000000000000000000
Creating the wrapper...
Semi upgrdable super token fDAIx created at 0x1f65B7b9b3ADB4354fF76fD0582bB6b0d046a41c
Wrapper created at 0x1f65B7b9b3ADB4354fF76fD0582bB6b0d046a41c
Resolver setting new address...
Resolver set done.

host 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
resolver 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
fdai 0x59b670e9fA9D0A427751Af201D676719a970857b
fdaix 0x1f65B7b9b3ADB4354fF76fD0582bB6b0d046a41c
factory 0x80E2E2367C5E9D070Ae2d6d50bF0cdF6360a7151

cfav1 0x9bd03768a7DCc129555dE410FF8E85528A4F88b5
idav1 0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1
loader v1 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

config

this will be deterministic when deploying on an empty ganache

```json
{
  "network": "mainnet",
  "testNetwork": "ganache",
  "hostStartBlock": 0,
  "hostAddress": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
  "cfaAddress": "0x9bd03768a7DCc129555dE410FF8E85528A4F88b5",
  "idaAddress": "0x440C0fCDC317D69606eabc35C0F676D1a8251Ee1",
  "superTokenFactoryAddress": "0x80E2E2367C5E9D070Ae2d6d50bF0cdF6360a7151",
  "resolverV1Address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
}
```
