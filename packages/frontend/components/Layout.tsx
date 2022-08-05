import { Container, Flex, Heading } from "@chakra-ui/react";
import Link from "next/link";
import { Account } from "./atoms/Account";

export default function Layout({ children }) {
  return (
    <Container maxW="container.lg">
      <Flex direction="row" justify="space-between">
        <Flex direction="column" py={4}>
          <Heading>Niflot</Heading>
          <Flex direction="row" gap={2} fontSize="xs">
            <Link href="/origin">for origins</Link>
            <Link href="/receiver">for receivers</Link>
          </Flex>
        </Flex>

        <Account />
      </Flex>
      <Flex>{children}</Flex>
    </Container>
  );
}
