import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { IWeb3FlowInfo } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useNiflot } from "../context/NiflotContext";
import { useSuperfluid } from "../context/SuperfluidContext";
import { useWeb3 } from "../context/Web3Context";

export const MintNiflot = () => {
  const { sf } = useSuperfluid();
  const { signer, account } = useWeb3();
  const { niflot } = useNiflot();
  const [origin, setOrigin] = useState<string>("");

  const [flowInfo, setFlowInfo] = useState<IWeb3FlowInfo>();

  const [durationHours, setDurationHours] = useState(24);
  const [showSliderTooltip, setShowSliderTooltip] = useState(false);

  const toast = useToast();

  const MIN_DURATION_HOURS = 24;
  const MAX_DURATION_HOURS = 24 * 30;

  useEffect(() => {
    if (!sf || !account || !signer || !origin) {
      setFlowInfo(undefined);
      return;
    }

    (async () => {
      const info = await sf.cfaV1.getFlow({
        receiver: account,
        sender: origin,
        superToken: process.env.NEXT_PUBLIC_DAIX as string,
        providerOrSigner: signer,
      });
      console.log(info);
      setFlowInfo(info);
    })();
  }, [sf, origin, signer, account]);

  const streamValue = useMemo(() => {
    if (!flowInfo || !durationHours) return "0";
    const durationSeconds = durationHours * 60 * 60;
    const flowRate = ethers.BigNumber.from(flowInfo.flowRate);
    const valueWei = flowRate.mul(durationSeconds);
    return ethers.utils.formatEther(valueWei);
  }, [flowInfo, durationHours]);

  const mint = async () => {
    if (!niflot || !durationHours || !origin) return;

    const durationSeconds = durationHours * 60 * 60;
    const result = await niflot.mint(
      process.env.NEXT_PUBLIC_DAIX as string,
      origin,
      durationSeconds
    );
    console.log(result);
    toast({
      status: "info",
      title: "niflot minted",
    });
  };

  return (
    <Flex direction="row" gap={8} w="100%">
      <FormControl>
        <FormLabel>origin</FormLabel>
        <Input
          type="text"
          placeholder="0x00"
          name="origin"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <FormHelperText>
          0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>duration</FormLabel>
        <Slider
          id="slider"
          defaultValue={MAX_DURATION_HOURS / 2}
          min={MIN_DURATION_HOURS}
          max={MAX_DURATION_HOURS}
          colorScheme="teal"
          onChange={(v) => setDurationHours(v)}
          onMouseEnter={() => setShowSliderTooltip(true)}
          onMouseLeave={() => setShowSliderTooltip(false)}
        >
          <SliderMark value={0} mt="1" ml="-2.5" fontSize="sm">
            1d
          </SliderMark>
          <SliderMark value={24 * 7} mt="1" ml="-2.5" fontSize="sm">
            7d
          </SliderMark>
          <SliderMark value={24 * 14} mt="1" ml="-2.5" fontSize="sm">
            14d
          </SliderMark>
          <SliderMark value={24 * 21} mt="1" ml="-2.5" fontSize="sm">
            21d
          </SliderMark>
          <SliderMark value={MAX_DURATION_HOURS} mt="1" ml="-2.5" fontSize="sm">
            30d
          </SliderMark>
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <Tooltip
            hasArrow
            bg="teal.500"
            color="white"
            placement="top"
            isOpen={showSliderTooltip}
            label={`${durationHours} hours`}
          >
            <SliderThumb />
          </Tooltip>
        </Slider>
        <FormHelperText>
          How many hours should that niflot run once sold?
        </FormHelperText>
      </FormControl>
      <Flex justify="flex-end" align="flex-end" direction="column">
        {streamValue && <Text>DAIx {streamValue}</Text>}
        <FormControl flex={1}>
          <FormLabel visibility="hidden">hidden</FormLabel>
          <Button onClick={mint}>mint niflot</Button>
        </FormControl>
      </Flex>
    </Flex>
  );
};
