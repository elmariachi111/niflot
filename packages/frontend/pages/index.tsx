import { Flex, Heading } from "@chakra-ui/react";
import type { NextPage } from "next";
import { NiflotProvider } from "../components/context/NiflotContext";
import { SFBalance } from "../components/molecules/SFBalance";

const Home: NextPage = () => {
  return (
    <>
      <NiflotProvider>
        <Heading>Niflot</Heading>
        <Flex>
          <SFBalance />
        </Flex>
      </NiflotProvider>
    </>
  );
};

export default Home;
