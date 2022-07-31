import React from "react";
import { Button, Container, Flex, Text } from "@chakra-ui/react";
import { useWeb3 } from "./context/Web3Context";

export default function Layout({ children }) {
  const { connect, account } = useWeb3();
  return (
    <Container>
      {account ? (
        <Text>{account}</Text>
      ) : (
        <Button onClick={connect}>connect</Button>
      )}
      <Flex>{children}</Flex>
    </Container>
  );
}
