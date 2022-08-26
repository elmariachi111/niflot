import { ChakraProvider } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { NiflotProvider } from "../components/context/NiflotContext";
import { SuperfluidProvider } from "../components/context/SuperfluidContext";
import { Web3Provider } from "../components/context/Web3Context";
import Layout from "../components/Layout";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Web3Provider>
        <SuperfluidProvider>
          <NiflotProvider>
            <Layout>
              <Head>
                <title>Niflot</title>
                <meta name="description" content="Mint streams as NFTs" />
                <link rel="icon" href="/favicon.ico" />
              </Head>
              <Component {...pageProps} />
            </Layout>
          </NiflotProvider>
        </SuperfluidProvider>
      </Web3Provider>
    </ChakraProvider>
  );
}

export default MyApp;
