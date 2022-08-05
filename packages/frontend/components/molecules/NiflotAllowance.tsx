import { Button, Flex, FormControl, FormLabel } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useNiflot } from "../context/NiflotContext";
import { useSuperfluid } from "../context/SuperfluidContext";
import { useWeb3 } from "../context/Web3Context";

export const NiflotAllowance = () => {
  const { signer } = useWeb3();
  const { sf } = useSuperfluid();
  const { niflot } = useNiflot();

  const allow = useCallback(async () => {
    if (!sf || !niflot || !signer) return;

    await sf.cfaV1
      .authorizeFlowOperatorWithFullControl({
        flowOperator: niflot.address,
        superToken: process.env.NEXT_PUBLIC_DAIX as string,
      })
      .exec(signer);
  }, [niflot, sf, signer]);

  return (
    <FormControl width="100%">
      <Flex
        direction="row"
        align="baseline"
        width="100%"
        justify="space-between"
      >
        <FormLabel>
          allow the Niflot contract to manage streams on your account's behalf
        </FormLabel>
        <Button onClick={allow}>allow</Button>
      </Flex>
    </FormControl>
  );
};
