import React, { useEffect } from "react";
import { useNiflot } from "../context/NiflotContext";
import { useWeb3 } from "../context/Web3Context";

export const YourNiflots = () => {
  const { account } = useWeb3();
  const { niflot } = useNiflot();

  useEffect(() => {
    if (!niflot || !account) return;
    (async () => {
      const balance = await niflot.balanceOf(account);
      console.log(balance);
      const promises = [...Array(balance.toNumber()).keys()].map((i) =>
        (async () => {
          const tokenId = await niflot.tokenOfOwnerByIndex(account, i);
          console.log(tokenId);
          const metadata = await niflot.tokenURI(tokenId);
          const niflotData = await niflot.getNiflotData(tokenId);
          return { metadata, niflotData };
        })()
      );

      const res = await Promise.all(promises);
      console.log(res);
    })();
  }, [niflot, account]);
  return <></>;
};
