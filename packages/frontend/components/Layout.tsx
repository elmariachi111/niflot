import React from "react";
import { Button, Container, Flex, Text } from "@chakra-ui/react";
import { useWeb3 } from "./context/Web3Context";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { connect, account, chainId } = useWeb3();
  return (
    <Container>
      <Text>{chainId}</Text>
      {account ? (
        <Text>{account}</Text>
      ) : (
        <Button onClick={connect}>connect</Button>
      )}
      <Flex>{children}</Flex>
    </Container>
  );
}
