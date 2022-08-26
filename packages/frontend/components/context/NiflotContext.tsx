import { Niflot, Niflot__factory } from "@niflot/contracts";
import React, { useContext, useEffect, useState } from "react";

import { useWeb3 } from "./Web3Context";

interface INiflotContext {
  niflot?: Niflot;
}

const NiflotContext = React.createContext<INiflotContext>({
  niflot: undefined,
});

const useNiflot = () => useContext(NiflotContext);

const NiflotProvider = ({ children }: { children: React.ReactNode }) => {
  const { signer } = useWeb3();
  const [niflot, setNiflot] = useState<Niflot>();

  useEffect(() => {
    if (!signer) return;
    setNiflot(
      Niflot__factory.connect(
        process.env.NEXT_PUBLIC_NIFLOT_CONTRACT as string,
        signer
      )
    );
  }, [signer]);

  return (
    <NiflotContext.Provider value={{ niflot }}>
      {children}
    </NiflotContext.Provider>
  );
};

export { NiflotProvider, useNiflot };
