import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { AccountBlockie } from "../atoms/Account";
import { useSuperfluid } from "../context/SuperfluidContext";
import { useWeb3 } from "../context/Web3Context";

export const StartFlow = () => {
  const { sf } = useSuperfluid();
  const { signer } = useWeb3();

  const [address, setAddress] = useState<string>("");
  const [flowRate, setFlowRate] = useState<string>("");

  const startFlow = async () => {
    if (!sf || !signer) return;
    if (!flowRate) return;
    if (!address) return;

    const flowrateWei = ethers.utils.parseEther(flowRate);

    const op = sf.cfaV1.createFlow({
      flowRate: flowrateWei.toString(),
      receiver: address,
      superToken: process.env.NEXT_PUBLIC_DAIX as string,
    });
    const result = await op.exec(signer);
    console.log(result);
  };

  return (
    <Flex direction="row" gap={8}>
      <FormControl flex={2}>
        <FormLabel>receiver</FormLabel>
        <InputGroup>
          <Input
            type="text"
            placeholder="0x00"
            name="receiver"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {address && (
            <InputRightElement>
              <AccountBlockie account={address} scale={0.65} />
            </InputRightElement>
          )}
        </InputGroup>
        <FormHelperText>
          0xdD2FD4581271e230360230F9337D5c0430Bf44C0
          <br />
          0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
        </FormHelperText>
      </FormControl>
      <FormControl flex={2}>
        <FormLabel>stream flowrate (tokens/s)</FormLabel>
        <Input
          type="text"
          name="flowrate"
          placeholder="0.1"
          value={flowRate}
          onChange={(e) => setFlowRate(e.target.value)}
        />
      </FormControl>
      <FormControl flex={1}>
        <FormLabel visibility="hidden">hidden</FormLabel>
        <Button onClick={startFlow} width="100%">
          start flow
        </Button>
      </FormControl>
    </Flex>
  );
};
