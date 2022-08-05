import { Framework } from "@superfluid-finance/sdk-core";
import React, { useContext, useEffect, useState } from "react";

import { useWeb3 } from "./Web3Context";

interface ISuperfluidContext {
  sf?: Framework;
}

const SuperfluidContext = React.createContext<ISuperfluidContext>({
  sf: undefined,
});

const useSuperfluid = () => useContext(SuperfluidContext);

const SuperfluidProvider = ({ children }: { children: React.ReactNode }) => {
  const { chainId, provider } = useWeb3();
  const [framework, setFramework] = useState<Framework>();

  useEffect(() => {
    if (!provider || !chainId) return;

    (async () => {
      setFramework(
        await Framework.create({
          resolverAddress: process.env.NEXT_PUBLIC_SF_RESOLVER,
          chainId,
          provider,
          protocolReleaseVersion: "test",
        })
      );
    })();
  }, [provider, chainId]);

  return (
    <SuperfluidContext.Provider value={{ sf: framework }}>
      {children}
    </SuperfluidContext.Provider>
  );
};

export { SuperfluidProvider, useSuperfluid };
