import { Container, Flex, Heading } from "@chakra-ui/react";
import { Account } from "./atoms/Account";

export default function Layout({ children }) {
  return (
    <Container maxW="container.lg">
      <Flex direction="row" justify="space-between">
        <Heading py={4}>Niflot</Heading>

        <Account />
      </Flex>
      <Flex>{children}</Flex>
    </Container>
  );
}
