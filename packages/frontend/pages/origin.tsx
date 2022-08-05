import { Flex, Heading } from "@chakra-ui/react";
import type { NextPage } from "next";
import { NiflotAllowance } from "../components/molecules/NiflotAllowance";
import { SFBalance } from "../components/molecules/SFBalance";
import { ActiveFlows } from "../components/organisms/ActiveFlows";
import { StartFlow } from "../components/organisms/StartFlow";

const Origin: NextPage = () => {
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
        <Heading size="md">Origin</Heading>
        <SFBalance />
      </Flex>
      <NiflotAllowance />
      <Flex direction="column" gap={2}>
        <Heading size="md">Outgoing Flows</Heading>
        <ActiveFlows />
      </Flex>
      <Flex direction="column" gap={2}>
        <Heading size="md">Start a new flow</Heading>
        <StartFlow />
      </Flex>
    </Flex>
  );
};

export default Origin;
