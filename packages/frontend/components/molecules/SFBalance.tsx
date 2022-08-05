import React, { useEffect, useState } from "react";
import { useWeb3 } from "../context/Web3Context";

import { Text } from "@chakra-ui/react";
import { useNiflot } from "../context/NiflotContext";
import { useSuperfluid } from "../context/SuperfluidContext";
import { ethers } from "ethers";

export const SFBalance = () => {
  const { provider, account } = useWeb3();
  const { niflot } = useNiflot();
  const { sf } = useSuperfluid();

  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!sf || !provider || !account) return;
    (async () => {
      const usdcx = await sf.loadSuperToken(
        process.env.NEXT_PUBLIC_DAIX as string
      );
      const weiBal = await usdcx.balanceOf({
        account,
        providerOrSigner: provider,
      });

      setBalance(ethers.utils.formatEther(weiBal));
    })();
  }, [sf, account, provider]);

  useEffect(() => {
    if (!niflot || !account) return;
    (async () => {
      const nfbal = await niflot.balanceOf(account);
    })();
  }, [niflot, account]);

  return <Text>DAIx bal: {balance}</Text>;
};
