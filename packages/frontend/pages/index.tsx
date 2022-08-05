import { Flex } from "@chakra-ui/react";
import type { NextPage } from "next";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <Flex direction="row" gap={8}>
      <Link href="/origin">for origins</Link>
      <Link href="/receiver">for receivers</Link>
    </Flex>
  );
};

export default Home;
