import { Flex, Text } from "@chakra-ui/react";
import { IWeb3FlowInfo } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useSuperfluid } from "../context/SuperfluidContext";
import { useWeb3 } from "../context/Web3Context";

export const ActiveFlows = () => {
  const { account, provider } = useWeb3();
  const { sf } = useSuperfluid();
  const [flowInfo, setFlowInfo] = useState<IWeb3FlowInfo>();

  useEffect(() => {
    if (!sf || !account || !provider) return;
    (async () => {
      const fr = await sf.cfaV1.getAccountFlowInfo({
        superToken: process.env.NEXT_PUBLIC_DAIX as string,
        account,
        providerOrSigner: provider,
      });
      if (fr.flowRate === "0") {
        setFlowInfo(undefined);
      } else {
        setFlowInfo(fr);
      }
    })();
  }, [sf, provider, account]);
  return (
    <Flex>
      {flowInfo && (
        <Flex direction="row" justify="space-between" w="100%">
          <Text>{flowInfo.timestamp.toISOString()}</Text>
          <Text>{ethers.utils.formatEther(flowInfo.flowRate)} DAIx/s</Text>
        </Flex>
      )}
    </Flex>
  );
};
