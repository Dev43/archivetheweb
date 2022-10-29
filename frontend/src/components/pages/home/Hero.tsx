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
  HStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
// example imports
import { providers } from "ethers";
// import WebBundlr
import { WebBundlr } from "@bundlr-network/client";
import Arweave from "arweave";
import { LoggerFactory, WarpFactory } from "warp-contracts";
import { inlineSource } from "inline-source";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { Buffer } from "buffer";
import {
  useAccount,
  useConnectModal,
  useDisconnect,
  useProvider,
} from "@web3modal/react";

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, open, close } = useConnectModal();
  const {
    isOpen: isOpenFinal,
    onOpen: onOpenFinal,
    onClose: onCloseFinal,
  } = useDisclosure();
  const [website, setwebsite] = React.useState<string>("https://ethlisbon.org");
  const [websitePreview, setwebsitePreview] = React.useState<string>(
    "https://ethlisbon.org"
  );
  const [frequency, setfrequency] = React.useState<number>();
  const [duration, setduration] = React.useState<number>();
  const [deploymentType, setDeploymentType] = React.useState<string>("arweave");
  const [provider, setProvider] = React.useState<any>();
  const [bundlr, setBundlr] = React.useState<any>();
  const [isConnected, setIsConnected] = React.useState<boolean>(true);
  const [isLongTerm, setisLongTerm] = React.useState<boolean>(true);
  const { provider: wcProvider, isReady: wcIsReady } = useProvider();
  const disconnect = useDisconnect();

  const { account, isReady: isAccountReadyWC } = useAccount();
  const {
    isOpen: isOpenModal,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();

  React.useEffect(
    () => {
      console.log(wcIsReady, isAccountReadyWC);
      console.log(account);
      if (wcIsReady && isAccountReadyWC && account.isConnected) {
        setDeploymentType("walletConnect");
        console.log(wcProvider);

        const provider = new providers.Web3Provider(wcProvider as any);
        console.log("gets here");
        provider._ready().then(() => {
          console.log("gets her222e");

          setProvider(wcProvider);
          console.log("prov ready wc");
          const bundlr = new WebBundlr(
            "https://node1.bundlr.network",
            "ethereum",
            provider
          );
          bundlr.ready().then(() => {
            console.log("setting bundlr from WC");
            setBundlr(bundlr);
            setIsConnected(true);
          });

          openLastModal();
        });
      }
    },
    [wcIsReady, isAccountReadyWC]
  );

  const handleSetWebsite = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(website);
    setwebsite(e.target.value);
    if (isValidUrl(e.target.value)) {
      setwebsitePreview(e.target.value);
    }
  };
  const handleSetFrequency = (e: React.ChangeEvent<HTMLInputElement>) => {
    setfrequency(+e.target.value);
  };
  const handleSetDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    setduration(+e.target.value);
  };

  // TODO probably use a service to package this
  const getWebpageSource = async (url: string = "") => {
    let html = await (await fetch(
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    )).json();
    return html.contents;
  };

  const handleConnectWalletBundlr = async () => {
    await (window.ethereum as any).enable();

    const provider = new providers.Web3Provider(window.ethereum as any);
    await provider._ready();

    setProvider(provider);

    const bundlr = new WebBundlr(
      "https://node1.bundlr.network",
      "ethereum",
      provider
    );
    await bundlr.ready();

    console.log("bal", await bundlr.getLoadedBalance());
    setBundlr(bundlr);
    setIsConnected(true);
    close();
    openLastModal();
  };

  // FOR SNAP
  const handleConnectMetamask = async () => {
    await (window.ethereum as any).enable();

    const provider = new providers.Web3Provider(window.ethereum as any);
    await provider._ready();
    setProvider(provider);
    setIsConnected(true);
    setDeploymentType("metamask");
  };

  const handleConnectWalletConnect = async () => {
    disconnect();
    // we open the walletconnect
    open();
    // we close the previous modal
    onCloseModal();
  };

  const openLastModal = async () => {
    onOpenFinal();
  };

  const handleDeploy = async () => {
    console.log("deploying type", deploymentType);

    let data = await getWebpageSource(website);
    let hash = Arweave.utils.bufferTob64Url(
      await Arweave.crypto.hash(Buffer.from(data), "SHA-256")
    );

    if (deploymentType == "arweave") {
    } else if (deploymentType == "walletConnect") {
    } else if (deploymentType == "metamask") {
      // must be metamask SNAP
    }

    const tags = [
      { name: "Content-Type", value: "text/html" },
      // { name: "Deployer", value: walletAddress },
      { name: "App-Name", value: "archive-the-web" },
      {
        name: "Timestamp",
        value: Math.round(Date.now() / 1000).toString(),
      },
      { name: "Sig-Type", value: "arweave" },
      { name: "Sig", value: "" },
      { name: "Data-SHA256", value: hash },
      { name: "Original-URL", value: website },
    ];
    console.log("Deploying to Bundlr");
    const transaction = bundlr.createTransaction(JSON.stringify(data), {
      tags: tags,
    });
    await transaction.sign();
    const id = (await transaction.upload()).data.id;
    console.log("deployed using", deploymentType, "with id", id);
    onCloseFinal();
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
          <HStack
            spacing="24px"
            borderWidth="1px"
            borderRadius="lg"
            borderColor={"grey"}
            height="60px"
          >
            <Box
              w="50%"
              h="100%"
              justifyContent={"center"}
              alignItems="center"
              alignContent={"center"}
              justifyItems="center"
              bg={isLongTerm ? "#1F94EE" : "white"}
            >
              Long Term
            </Box>
            <Box
              w="50%"
              h="100%"
              justifyContent={"center"}
              alignItems="center"
              alignContent={"center"}
              justifyItems="center"
              bg={isLongTerm ? "white" : "#1F94EE"}
            >
              One Time
            </Box>
          </HStack>
          <Box>Website:</Box>
          <Input
            borderColor={"grey"}
            variant="outline"
            placeholder="website"
            value={website}
            size="lg"
            onChange={handleSetWebsite}
          />
          {isLongTerm && (
            <Box>
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
                <NumberInputField
                  onChange={handleSetFrequency}
                  value={frequency}
                />
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
                <NumberInputField
                  onChange={handleSetDuration}
                  value={duration}
                />
              </NumberInput>
            </Box>
          )}

          {isConnected ? (
            // <Button
            //   colorScheme="blue"
            //   variant="solid"
            //   width={"100%"}
            //   onClick={handleDeploy}
            // >
            //   Deploy
            // </Button>

            <>
              <Button
                onClick={onOpenModal}
                colorScheme="blue"
                variant="solid"
                width={"100%"}
              >
                Connect
              </Button>

              <Modal
                isOpen={isOpenModal}
                onClose={onCloseModal}
                colorScheme={"white"}
              >
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader bgColor={"white"} color="grey">
                    Connect to a Wallet
                  </ModalHeader>
                  <ModalBody bgColor={"white"} color="grey">
                    <Stack spacing={3}>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={"grey"}
                        onClick={handleConnectWalletBundlr}
                      >
                        Arweave x Bundlr
                      </Button>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={"grey"}
                      >
                        Metamask
                      </Button>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={"grey"}
                        onClick={handleConnectWalletConnect}
                      >
                        WalletConnect
                      </Button>
                    </Stack>
                  </ModalBody>

                  <ModalFooter bgColor={"white"} />
                </ModalContent>
              </Modal>
            </>
          ) : (
            <Button
              colorScheme="blue"
              variant="solid"
              width={"100%"}
              onClick={handleConnectWalletBundlr}
            >
              Connect Wallet
            </Button>
          )}
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
          id="myFrame"
          width={"100%"}
          height="500px"
          // style={{
          //   "iframe": {

          //   }
          // }}
          src={websitePreview}
        />
        <DeployModal
          onOpen={onCloseFinal}
          isOpen={isOpenFinal}
          onClose={onCloseFinal}
          website={website}
          data={website}
          handleDeploy={handleDeploy}
        />
      </Flex>
    </Flex>
  );
};

export default Hero;

function DeployModal(args: any) {
  let { isOpen, onOpen, onClose, website, handleDeploy } = args;
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bgColor="white" color="grey">
          <ModalHeader bgColor="white" color="grey">
            Confirm Archiving
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box>URL: {website}</Box>
            <Box>Snapshot frequency {website}</Box>
            <Box>Duration: {website}</Box>
            <Box>Snapshots per day: {website}</Box>
            <Box>Total snapshots: {website}</Box>
            <Box>Expected price per snapshots: {website}</Box>
            <Box>Total Cost: {website}</Box>
            <Box>
              *Duration and total snapshots are approximate and based on today’s
              price for archiving. Price fluctuations may impact the actual
              duration and total snapshots.
            </Box>
          </ModalBody>

          <ModalFooter>
            <Button
              color="white"
              width="100%"
              colorScheme="blue"
              mr={3}
              onClick={handleDeploy}
            >
              Confirm Archiving
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

const isValidUrl = (urlString: string) => {
  var urlPattern = new RegExp(
    "^(https?:\\/\\/)?" + // validate protocol
    "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // validate domain name
    "((\\d{1,3}\\.){3}\\d{1,3}))" + // validate OR ip (v4) address
    "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // validate port and path
    "(\\?[;&a-z\\d%_.~+=-]*)?" + // validate query string
      "(\\#[-a-z\\d_]*)?$",
    "i"
  ); // validate fragment locator
  return !!urlPattern.test(urlString);
};
// first we allow the user to upload themselves

// then we use a diff version of warp to use BUNDLR to then be able to create these things

// add the contract interactions now
// TODO deploy (or locally!) a server to deploy the websites nicely
