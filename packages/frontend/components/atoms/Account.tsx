import {
  Button,
  Circle,
  Flex,
  forwardRef,
  Menu,
  MenuButton,
  Text,
} from "@chakra-ui/react";
import { ethers } from "ethers";

import { useEffect, useState } from "react";
import Blockies from "react-blockies";
import { useWeb3 } from "../context/Web3Context";

export const AccountBlockie = ({
  account,
  scale,
}: {
  account: string;
  scale?: number;
}) => {
  return (
    <Circle size="2.75em" overflow="hidden" transform={`scale(${scale || 1})`}>
      <Blockies seed={account.toLowerCase()} size={8} scale={6} />
    </Circle>
  );
};

export function truncateAddress(address: string) {
  const [first, last] = [
    address.substring(0, 6),
    address.substring(address.length - 4, address.length),
  ];
  return `${first}..${last}`;
}

const Identicon = forwardRef((props, ref) => {
  const { account, ...rest } = props;
  return (
    <Button ref={ref} p={0} {...rest}>
      <AccountBlockie account={account} />
    </Button>
  );
});

export const Account = () => {
  const { connect, account, chainId, provider } = useWeb3();
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!provider || !account) return;
    (async () => {
      const bal = await provider.getBalance(account);
      const eth = ethers.utils.formatUnits(bal, "ether");
      const ethFloat = parseFloat(eth);
      setBalance(ethFloat.toFixed(4));
    })();
  }, [provider, account]);

  if (!account) {
    return <Button onClick={connect}>connect</Button>;
  }

  return (
    <Flex bg="white" align="center" pr={[0, 2]}>
      <Flex
        direction="column"
        align="flex-end"
        justify="center"
        display={["none", "flex"]}
        py={1}
        pr={3}
        pl={5}
      >
        <Flex direction="row" fontWeight="bold" fontSize={"lg"} gridGap={1}>
          <Text>{balance}</Text>
          <Text display={["none", "inline"]}>ETH</Text>
          <Text display={["inline", "none"]}>E</Text>
        </Flex>
        {account && (
          <Text fontSize={["xx-small", "xs"]} fontFamily="mono">
            {truncateAddress(account)}
          </Text>
        )}
        <Text fontSize="x-small">{chainId}</Text>
      </Flex>
      <Menu>
        {account && <MenuButton as={Identicon} account={account} />}
        {/* <MenuList>
          <MenuItem onClick={disconnect}>Logout</MenuItem>
        </MenuList> */}
      </Menu>
    </Flex>
  );
};
