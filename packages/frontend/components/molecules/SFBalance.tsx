import React, { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { Framework } from "@superfluid-finance/sdk-core";
import { Text } from "@chakra-ui/react";
import { useNiflot } from "../context/NiflotContext";

export const SFBalance = () => {
  const { provider, chainId, account } = useWeb3();
  const { niflot } = useNiflot();

  const [sf, setSf] = useState<Framework>();
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!provider || !chainId) return;

    (async () => {
      setSf(
        await Framework.create({
          resolverAddress: process.env.NEXT_PUBLIC_SF_RESOLVER,
          chainId,
          provider,
          protocolReleaseVersion: "test",
        })
      );
    })();
  }, [provider, chainId]);

  useEffect(() => {
    if (!sf || !provider || !account) return;
    (async () => {
      const usdcx = await sf.loadSuperToken(
        process.env.NEXT_PUBLIC_DAIX as string
      );
      setBalance(
        await usdcx.balanceOf({ account, providerOrSigner: provider })
      );
    })();
  }, [sf, account, provider]);

  useEffect(() => {
    if (!niflot || !account) return;
    (async () => {
      const nfbal = await niflot.balanceOf(account);
      console.log(nfbal);
    })();
  }, [niflot, account]);

  return <Text>bal: {balance}</Text>;
};
