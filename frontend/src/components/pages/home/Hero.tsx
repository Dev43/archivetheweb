import * as React from "react";
import {
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Box,
  Input,
  useBreakpointValue,
  NumberInput,
  NumberInputField,
  HStack,
  useDisclosure,
  Center,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
// example imports
import { providers } from "ethers";
// import WebBundlr
import { WebBundlr } from "@bundlr-network/client";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
import { Image } from "@chakra-ui/react";
// @ts-ignore
import floppy from "../../../images/Floppy.webp";
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
  useSigner,
} from "@web3modal/react";
import { DEPLOYED_ADDRESS } from "../../../constants/chain";

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
  const [cost, setCost] = React.useState<number>(0.007);
  const [archivor, setarchivor] = React.useState<any>(null);
  const [isTxInProgress, setisTxInProgress] = React.useState<any>(false);
  const [txID, setTxID] = React.useState<string>("");
  const [contractState, setContractState] = React.useState<any>({});
  const disconnect = useDisconnect();
  const warp = WarpFactory.forMainnet();
  const arweave = warp.arweave;

  const {
    data,
    error: wcError,
    isLoading: isWCSignerLoading,
    refetch: refetchWCSigner,
  } = useSigner();
  const { account, isReady: isAccountReadyWC } = useAccount();
  const {
    isOpen: isOpenModal,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();
  const refreshState = async () => {
    if (archivor) {
      setContractState(
        (await archivor.viewState({
          function: "getState",
        })).state
      );
      console.log("refreshed");
    }
  };

  React.useEffect(
    () => {
      (async () => {
        await refreshState();
      })();
      return () => {
        // this now gets called when the component unmounts
      };
    },
    [archivor]
  );
  React.useEffect(
    () => {
      (async () => {
        console.log(isWCSignerLoading);
        console.log(data);
        console.log("wc connected", account.isConnected);
        console.log(wcError);
        if (data && account.isConnected) {
          setDeploymentType("walletConnect");

          const provider = new providers.Web3Provider(data.provider as any);
          await provider._ready();
          console.log("provider is ready");
          setProvider(data);
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
            openLastModal();
          });
        }
      })();
      return () => {
        // this now gets called when the component unmounts
      };
    },
    [isAccountReadyWC, data, account]
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
    let html = await (await fetch(`http://127.0.0.1:3001/?url=${url}`)).text();
    return html;
  };
  const handleArconnect = async () => {
    let arch = await warp
      .contract(DEPLOYED_ADDRESS)
      .setEvaluationOptions({
        internalWrites: true,
      })
      .connect("use_wallet");

    setarchivor(arch);

    console.log("Arconnect ready");
    setDeploymentType("arconnect");
    setIsConnected(true);
    close();
    openLastModal();
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
    setDeploymentType("arweave");
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

  const clear = () => {
    setisTxInProgress(false);
    setTxID("");
  };

  const handleDeploy = async () => {
    console.log("deploying type ", deploymentType, "long term", isLongTerm);

    let data = await getWebpageSource(website);
    let hash = Arweave.utils.bufferTob64Url(
      await Arweave.crypto.hash(Buffer.from(data), "SHA-256")
    );

    if (isLongTerm) {
      console.log("in long term deploy");

      if (deploymentType == "arweave") {
        return;
      } else if (deploymentType == "walletConnect") {
        return;
      } else if (deploymentType == "metamask") {
        // METAMASK SNAP!!
        return;
      } else if (deploymentType == "arconnect") {
        if (frequency == undefined) {
          console.log("freq is undef");
          return;
        }
        if (duration == undefined) {
          console.log("duration is undef");
          return;
        }
        // first they would need to pay someone
        // then they would be able to go ahead and do this
        // right now we shortcut it for time
        let amountNeeded = Math.round((duration * 24 * 60) / frequency);
        await archivor.writeInteraction({
          function: "createOrder",
          orderAction: {
            website: website,
            amount_to_transfer: amountNeeded,
            // seconds
            frequency: frequency * 60,
            // seconds
            duration: duration * 24 * 60 * 60,
          },
        });

        await refreshState();
        onCloseFinal();
        return;
      }
    } else {
      // deploy with arweave bundlr
      if (deploymentType == "arweave") {
        // short term
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
        const transaction = bundlr.createTransaction(data, {
          tags: tags,
        });
        await transaction.sign();
        const id = (await transaction.upload()).data.id;
        setTxID(id);
        setisTxInProgress(true);
        console.log("deployed using", deploymentType, "with id", id);
        await sleep(5000);
        onCloseModal();
        onCloseFinal();
        clear();
      }
    }
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
            height="30px"
          >
            <Box
              w="50%"
              h="100%"
              justifyContent={"center"}
              alignItems="center"
              alignContent={"center"}
              justifyItems="center"
              bg={isLongTerm ? "rgba(31, 148, 238, 0.18)" : "white"}
              onClick={() => setisLongTerm(!isLongTerm)}
            >
              <Center>Long Term</Center>
            </Box>
            <Box
              w="50%"
              h="100%"
              justifyContent={"center"}
              alignItems="center"
              alignContent={"center"}
              justifyItems="center"
              bg={isLongTerm ? "white" : "rgba(31, 148, 238, 0.18)"}
              onClick={() => setisLongTerm(!isLongTerm)}
            >
              <Center>One Time</Center>
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
                min={1}
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

          <Box>Expected Price Per Snapshot USD $0.007</Box>
          <Box>
            Total Snapshots*{" "}
            {frequency && duration && (duration * 24 * 60) / frequency}
          </Box>
          <Box>
            Total Cost ${frequency &&
              duration &&
              ((duration * 24 * 60) / frequency) * cost}
          </Box>
          {isConnected ? (
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
                        onClick={handleArconnect}
                      >
                        Arconnect
                      </Button>
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
                        Metamask SNAP
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
          frequency={frequency}
          duration={duration}
          cost={cost}
          isTxInProgress={isTxInProgress}
          txID={txID}
        />
      </Flex>
    </Flex>
  );
};

export default Hero;

function DeployModal(args: any) {
  let {
    isOpen,
    onOpen,
    onClose,
    website,
    handleDeploy,
    frequency,
    duration,
    cost,
    isTxInProgress,
    txID,
  } = args;
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bgColor="white" color="grey">
          {isTxInProgress ? (
            <>
              <ModalHeader bgColor="white" color="grey">
                Transaction in progress
              </ModalHeader>

              <ModalBody>
                <Box boxSize="lg">
                  <Image src={floppy} alt="Nyan" />
                </Box>
                <Box>Tx ID: ${txID}</Box>
              </ModalBody>

              <ModalFooter />
            </>
          ) : (
            <>
              <ModalHeader bgColor="white" color="grey">
                Confirm Archiving
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Box>URL: {website}</Box>
                <Box>Snapshot frequency: every {frequency} minutes</Box>
                <Box>Duration: {duration} day</Box>
                <Box>Snapshots per day: {(24 * 60) / frequency}</Box>
                <Box>
                  Total snapshots:{" "}
                  {duration && frequency && (duration * 24 * 60) / frequency}
                </Box>
                <Box>Expected price per snapshots: ${cost}</Box>
                <Box>
                  Total Cost: ${duration &&
                    frequency &&
                    ((duration * 24 * 60) / frequency) * cost}{" "}
                </Box>
                <Box>
                  *Duration and total snapshots are approximate and based on
                  today’s price for archiving. Price fluctuations may impact the
                  actual duration and total snapshots.
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
            </>
          )}
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
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
