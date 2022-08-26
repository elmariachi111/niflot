import {
  Badge,
  Button,
  Flex,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useNiflot } from "../context/NiflotContext";
import { useSuperfluid } from "../context/SuperfluidContext";
import { useWeb3 } from "../context/Web3Context";

export const NiflotAllowance = () => {
  const { provider, signer, account } = useWeb3();
  const { sf } = useSuperfluid();
  const { niflot } = useNiflot();
  const [niflotAllowed, setNiflotAllowed] = useState<boolean>(false);

  const toast = useToast();

  useEffect(() => {
    if (!sf || !niflot || !provider || !account) return;
    const filter = sf.cfaV1.contract.filters.FlowOperatorUpdated(
      process.env.NEXT_PUBLIC_DAIX as string,
      account,
      niflot.address
    );
    (async () => {
      const allowanceEvents = await sf.cfaV1.contract
        .connect(provider)
        .queryFilter(filter);

      setNiflotAllowed(allowanceEvents.length > 0);
    })();
  }, [sf, provider, signer, niflot, account]);
  const allow = useCallback(async () => {
    if (!sf || !niflot || !signer) return;
    try {
      await sf.cfaV1
        .authorizeFlowOperatorWithFullControl({
          flowOperator: niflot.address,
          superToken: process.env.NEXT_PUBLIC_DAIX as string,
        })
        .exec(signer);
      setNiflotAllowed(true);
    } catch (e: any) {
      toast({
        title: "that whent wrong",
        description: e.message,
        status: "error",
      });
    }
  }, [niflot, sf, signer, toast]);

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
        {niflotAllowed ? (
          <Badge ml="1" fontSize="0.8em" colorScheme="green">
            Allowed
          </Badge>
        ) : (
          <Button onClick={allow}>allow</Button>
        )}
      </Flex>
    </FormControl>
  );
};
