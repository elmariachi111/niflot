import { Flex, Heading } from "@chakra-ui/react";
import type { NextPage } from "next";
import { SFBalance } from "../components/molecules/SFBalance";
import { ActiveFlows } from "../components/organisms/ActiveFlows";
import { MintNiflot } from "../components/organisms/MintNiflot";
import { YourNiflots } from "../components/organisms/YourNiflots";

const Receiver: NextPage = () => {
  return (
    <Flex direction="column" gap={8} width="100%">
      <Flex
        my={4}
        px={1}
        direction="row"
        width="100%"
        justify="space-between"
        borderBottomStyle="solid"
        borderColor="gray.200"
        borderBottomWidth={1}
      >
        <Heading size="md">Receiver</Heading>
        <SFBalance />
      </Flex>
      <Flex direction="column" gap={2}>
        <Heading size="md">Incoming Flows</Heading>
        <ActiveFlows />
      </Flex>
      <Flex direction="column" gap={2}>
        <Heading size="md">Mint a Niflot</Heading>
        <MintNiflot />
      </Flex>
      <Flex direction="column" gap={2}>
        <Heading size="md">Your Niflots</Heading>
        <YourNiflots />
      </Flex>
    </Flex>
  );
};

export default Receiver;
