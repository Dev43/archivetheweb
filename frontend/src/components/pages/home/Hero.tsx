import * as React from "react";
import {
  Button,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  Box,
  Input,
  useBreakpointValue,
  NumberInput,
  NumberInputField,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
// example imports
import { providers } from "ethers";
// import WebBundlr
import { WebBundlr } from "@bundlr-network/client";
import { Buffer } from "buffer";
Buffer.from("anything", "base64");
window.Buffer = window.Buffer || require("buffer").Buffer;

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [website, setwebsite] = React.useState<string>();
  const [frequency, setfrequency] = React.useState<number>();
  const [duration, setduration] = React.useState<number>();
  const [provider, setProvider] = React.useState<any>();

  const handleSetWebsite = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(website);
    setwebsite(e.target.value);
  };
  const handleSetFrequency = (e: React.ChangeEvent<HTMLInputElement>) => {
    setfrequency(+e.target.value);
  };
  const handleSetDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    setduration(+e.target.value);
  };

  const handleConnectWallet = async () => {
    await window.ethereum.enable();

    const provider = new providers.Web3Provider(window.ethereum as any);
    await provider._ready();

    setProvider(provider);

    const bundlr = new WebBundlr(
      "https://node1.bundlr.network",
      "matic",
      provider
    );
    await bundlr.ready();
  };

  return (
    <Flex
      my={"140px"}
      height={"685px"}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={"grey"}
    >
      <Flex
        p={8}
        flex={1}
        alignItems={"center"}
        justify={"center"}
        border={"medium"}
        color={"grey"}
        borderWidth="1px"
        borderRadius="lg"
      >
        <Stack spacing={3}>
          <Box>Website:</Box>
          <Input
            borderColor={"grey"}
            variant="outline"
            placeholder="website"
            size="lg"
            onChange={handleSetWebsite}
          />
          <Box>Snapshot frequency (in minutes):</Box>
          <NumberInput
            min={10}
            max={30000}
            borderColor={"grey"}
            variant="outline"
            placeholder="snapshot frequency (in minutes)"
            color={"grey"}
            size="lg"
          >
            <NumberInputField onChange={handleSetFrequency} />
          </NumberInput>
          <Box>Ideal duration (in days)</Box>

          <NumberInput
            min={1}
            max={2000000000}
            borderColor={"grey"}
            variant="outline"
            placeholder="ideal duration (in days)"
            size="lg"
          >
            {" "}
            <NumberInputField onChange={handleSetDuration} />
          </NumberInput>

          <Button
            colorScheme="blue"
            variant="solid"
            width={"100%"}
            onClick={handleConnectWallet}
          >
            Connect Wallet
          </Button>
          <Box>Pay with Arweave using (AR) (Metamask) (WalletConnect)</Box>
        </Stack>
      </Flex>
      <Flex p={8} flex={1} alignItems={"center"} justify={"center"}>
        {/* <Iframe
          url="https://www.ethlisbon.org"
          width="100%"
          height="500px"
          id=""
          className=""
          display="block"
          position="relative"
        /> */}
        <iframe
          id="frame"
          width={"100%"}
          height="500px"
          // style={{
          //   "iframe": {

          //   }
          // }}
          src="https://ethlisbon.org"
        />
      </Flex>
    </Flex>
  );
};

export default Hero;
