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
  TableContainer,
  Table,
  TableCaption,
  Th,
  Tbody,
  Td,
  Tfoot,
  Tr,
  Thead,
} from "@chakra-ui/react";
import { useNavigate } from "react-router";
// example imports
import detectEthereumProvider from '@metamask/detect-provider';

import { providers } from "ethers";
// import WebBundlr
import { WebBundlr } from "@bundlr-network/client";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
import { Image } from "@chakra-ui/react";
import { evmSignature, EvmSignatureVerificationPlugin } from 'warp-signature';
// @ts-ignore
import floppy from "../../../images/Floppy.webp";
import ar from "../../../images/ar.png";
import mm from "../../../images/mm.png";
import wc from "../../../images/wc.png";
import arconnect from "../../../images/arconnect.svg";
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
  useSigner,
} from "@web3modal/react";
import { DEPLOYED_ADDRESS } from "../../../constants/chain";
import { bundlerize } from "../../../context/bundlr";
const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen: isOpenWCModal, open: openWCModal, close: closeWCModal } = useConnectModal();
  const {
    isOpen: isOpenFinal,
    onOpen: onOpenFinal,
    onClose: onCloseFinal,
  } = useDisclosure();
  const [website, setwebsite] = React.useState<string>("https://bbc.com");
  const [websitePreview, setwebsitePreview] = React.useState<string>(
    "https://bbc.com"
  );
  const [frequency, setfrequency] = React.useState<number>(1);
  const [duration, setduration] = React.useState<number>(1);
  const [deploymentType, setDeploymentType] = React.useState<string>("arweave");
  const [provider, setProvider] = React.useState<any>();
  const [bundlr, setBundlr] = React.useState<any>();
  const [isConnected, setIsConnected] = React.useState<boolean>(false);
  const [isLongTerm, setisLongTerm] = React.useState<boolean>(true);
  const [cost, setCost] = React.useState<number>(0.007);
  const [archivor, setarchivor] = React.useState<any>(null);
  const [isTxInProgress, setisTxInProgress] = React.useState<any>(false);
  const [isConnectButtonDisabled, disableConnectButton] = React.useState<any>(false);
  const [txID, setTxID] = React.useState<string>("");
  const [contractState, setContractState] = React.useState<any>({});
  const disconnect = useDisconnect();
  let warp = (WarpFactory.forMainnet() as any).use(new EvmSignatureVerificationPlugin());


  // WC
  const {
    data: wcSigner,
    error: wcError,
    isLoading: isWCSignerLoading,
    refetch: refetchWCSigner,
  } = useSigner();
  const { account, isReady: isAccountReadyWC } = useAccount();

  const {
    isOpen: isOpenModal,
    onOpen: openConnectionModal,
    onClose: closeConnectionModal,
  } = useDisclosure();

  const refreshState = async () => {
    if (archivor) {
      setContractState(
        (await archivor.viewState({
          function: "getState",
        })).state
      );
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
      console.log(account)
      if (account.isConnected && wcSigner) {
        console.log("disconnecting from wc")
        handleConnectWalletConnect()
      }
    },
    [wcSigner, isWCSignerLoading, wcError]
  );

  React.useEffect(
    () => {
      disableConnectButton(calcshouldConnectBeDisabled())
    },
    [isLongTerm, frequency, duration, website]
  );

  const calcshouldConnectBeDisabled = () => {
    if (isLongTerm && frequency && frequency > 0 && duration && duration > 0 && isValidUrl(website)) {
      return false
    } else if (isValidUrl(website)) {
      return false
    }
    return true
  }

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
    closeConnectionModal()
    openLastModal();
  };


  const handleBundlrConnection = async () => {
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
    closeConnectionModal()
    openLastModal();
  };

  const handleConnectWalletConnect = async () => {

    // TODO seperate short term and long term

    // console.log(wcProvider.getSigner())
    console.log("in handleWC")
    if (!wcSigner && account.isConnected) {
      refetchWCSigner()
      return
    }
    console.log(wcSigner)
    console.log(account.isConnected)

    setDeploymentType("walletconnect")
    setIsConnected(true);
    closeWCModal();
    openLastModal();

  };

  const openWalletConnect = async () => {
    // we open the walletconnect

    if (isLongTerm) {
      alert("Currently not supported for long term contracts, head to one time for it to work")
      return
    }
    openWCModal();
    // we close the previous modal

  };

  const openLastModal = async () => {
    onOpenFinal();
  };

  const clear = () => {
    setisTxInProgress(false);
    setTxID("");
  };





  let handleConnectMM = async () => {

    const provider = await detectEthereumProvider();

    // web3_clientVersion returns the installed MetaMask version as a string
    const isFlask = (
      await (provider as any).request({ method: 'web3_clientVersion' })
    )?.includes('flask');

    if (provider && isFlask) {
      console.log('MetaMask Flask successfully detected!');

      // Now you can use Snaps!
    } else {
      console.error('Please install MetaMask Flask!');
    }
    // await (window.ethereum as any).enable()
    await connectSnap()


    setDeploymentType("metamask")
    setIsConnected(true);
    closeConnectionModal()
    openLastModal();
  }

  const handleDisconnect = () => {
    disconnect()
    setIsConnected(false)
  }

  const handleDeploy = async () => {
    console.log("deploying type ", deploymentType, "long term", isLongTerm);

    let data = await getWebpageSource(website);
    let hash = Arweave.utils.bufferTob64Url(
      await Arweave.crypto.hash(Buffer.from(data), "SHA-256")
    );

    if (isLongTerm) {
      console.log("in long term deploy");
      if (frequency == undefined) {
        console.log("freq is undef");
        return;
      }
      if (duration == undefined) {
        console.log("duration is undef");
        return;
      }
      let amountNeeded = Math.round((duration * 24 * 60) / frequency);
      let freq = frequency * 60;
      let dur = duration * 24 * 60 * 60
      if (deploymentType == "arweave") {
        return;
      } else if (deploymentType == "walletconnect") {
        alert("Currently not supported")
        return;
      } else if (deploymentType == "metamask") {
        console.log("in here")

        // here we use warp eth sig!
        let arch = await warp
          .contract(DEPLOYED_ADDRESS)
          .setEvaluationOptions({
            internalWrites: true,
          })
          .connect({ signer: evmSignature, signatureType: 'ethereum' });
        console.log("connected to long term mm")

        await arch.writeInteraction({
          function: "createOrder",
          orderAction: {
            website: website,
            amount_to_transfer: amountNeeded,
            // seconds
            frequency: freq,
            // seconds
            duration: dur,
          },
        });

        await refreshState();
        onCloseFinal();
        return;


        return;
      } else if (deploymentType == "arconnect") {

        // first they would need to pay someone
        // then they would be able to go ahead and do this
        // right now we shortcut it for time

        await archivor.writeInteraction({
          function: "createOrder",
          orderAction: {
            website: website,
            amount_to_transfer: amountNeeded,
            // seconds
            frequency: freq,
            // seconds
            duration: dur,
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
        closeConnectionModal();
        onCloseFinal();
        clear();
      } else if (deploymentType == "metamask") {
        let source = await getWebpageSource(website)

        const id = await (window.ethereum as any).request({
          method: "wallet_invokeSnap",
          params: [
            defaultSnapOrigin,
            { method: "bundle_data", params: { data: source } },
          ],
        });
        setTxID(id);
        setisTxInProgress(true);
        console.log("deployed using", deploymentType, "with id", id);
        await sleep(5000);
        closeConnectionModal();
        onCloseFinal();
        clear();
      }
      else if (deploymentType == "walletconnect") {
        let source = await getWebpageSource(website)

        let txID = await bundlerize(source, (wcSigner as any));
        console.log(txID)
        setTxID(txID);
        setisTxInProgress(true);
        console.log("deployed using", deploymentType, "with id", txID);
        await sleep(5000);
        closeConnectionModal();
        onCloseFinal();
        clear();
      }
    }
  };



  return (
    <Flex
      my={"10px"}
      height={"650px"}
      borderWidth="1px"
      borderRadius="lg"
      borderColor={"grey"}
    >
      <Flex
        p={2}
        flex={1}
        alignItems={"center"}
        justify={"center"}
        border={"small"}
        color={"grey"}
        borderWidth="1px"
        borderRadius="lg"
      >
        <Stack spacing={2}>
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
          <Box color="black">Website:</Box>
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
              <Box color="black">Snapshot frequency (in minutes):</Box>
              <NumberInput
                min={1}
                max={30000}
                borderColor={"grey"}
                variant="outline"
                placeholder="https://bbc.com"
                color={"grey"}
                size="lg"
              >
                <NumberInputField
                  placeholder="i.e every 60 minutes"
                  onChange={handleSetFrequency}
                  value={frequency}
                />
              </NumberInput>
              <Box color="black">Duration (in days)</Box>

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
                  placeholder="Days snapshots will be prepaid (i.e. 365 days)"
                />
              </NumberInput>
            </Box>
          )}

          <TableContainer bgColor={"rgba(31, 148, 238, 0.1)"} borderRadius="xl" marginBottom="20px">
            <Table variant='nostyle'>
              <Tbody >
                <Tr >
                  <Td>  Expected Price Per Snapshot (USD)</Td>
                  <Td>    $0.007  </Td>
                </Tr>
                <Tr>
                  <Td>
                    Total Snapshots*{" "}
                  </Td>
                  <Td isNumeric>
                    {frequency && duration && (duration * 24 * 60) / frequency}
                  </Td>
                </Tr>
                <Tr>
                  <Td>

                    Total Cost{" "}

                  </Td>
                  <Td isNumeric>
                    ${frequency &&
                      duration &&
                      ((duration * 24 * 60) / frequency) * cost}
                  </Td>
                </Tr>
              </Tbody>

            </Table>
          </TableContainer>


          {!isConnected ? (
            <>
              <Button
                onClick={openConnectionModal}
                bgColor="#1F94EE"
                variant="solid"
                color="white"
                height={"60px"}
                marginTop="20px"
                disabled={isConnectButtonDisabled}
                _hover={{
                  textDecoration: "none",
                  bg: "secondary",
                }}
                width={"100%"}
              >
                Connect Wallet
              </Button>

              <Modal
                isOpen={isOpenModal}
                onClose={closeConnectionModal}
                colorScheme={"white"}
              >
                <ModalOverlay />
                <ModalContent borderRadius={"xl"}>
                  <ModalHeader borderRadius={"sm"} bgColor={"white"} color="black">
                    Connect a Wallet
                  </ModalHeader>
                  <ModalBody bgColor={"white"} color="grey">
                    <Stack spacing={3}>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={"rgba(0, 0, 0, 0.1)"}
                        bgColor="rgba(31, 148, 238, 0.1)"
                        height={"50px"}

                        onClick={handleArconnect}
                      >

                        <HStack w="100%" spacing={6}>
                          <img height={"25px"} width="25px" src={arconnect} />
                          <Box color="black">
                            Arweave x Arconnect
                          </Box>
                        </HStack>
                      </Button>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        hidden={!isLongTerm}
                        borderColor={"rgba(0, 0, 0, 0.1)"}
                        bgColor="rgba(31, 148, 238, 0.1)"
                        height={"50px"}

                        onClick={handleBundlrConnection}
                      >

                        <HStack w="100%" spacing={6}>
                          <img height={"25px"} width="25px" src={ar} />
                          <Box color="black">
                            Arweave x Bundlr
                          </Box>
                        </HStack>
                      </Button>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={"rgba(0, 0, 0, 0.1)"}
                        bgColor="rgba(31, 148, 238, 0.1)"
                        height={"50px"}
                        onClick={handleConnectMM}
                      >
                        <HStack w="100%" spacing={6}>
                          <img height={"25px"} width="25px" src={mm} />
                          <Box color="black">
                            {isLongTerm ? "Metamask x Warp" : "Metamask SNAP x Bundlr"}
                          </Box>
                        </HStack>
                      </Button>
                      <Button
                        borderWidth="1px"
                        borderRadius="lg"
                        height={"50px"}
                        borderColor={"rgba(0, 0, 0, 0.1)"}
                        bgColor="rgba(31, 148, 238, 0.1)"
                        onClick={openWalletConnect}
                      >
                        <HStack w="100%" spacing={6}>
                          <img height={"25px"} width="25px" src={wc} />
                          <Box color="black">
                            WalletConnect
                          </Box>
                        </HStack>
                      </Button>
                    </Stack>
                  </ModalBody>

                  <ModalFooter bgColor={"white"} borderRadius={"sm"} />
                </ModalContent>
              </Modal>
            </>
          ) : (
            <Button
              colorScheme="blue"
              variant="solid"
              width={"100%"}

              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
          <Flex alignItems={"center"} justify="center">
            <Center>

              <HStack>
                <Box>

                  Pay with Arweave using{" "}
                </Box>


                <img height={"25px"} width="25px" src={ar} />

                <img height={"25px"} width="25px" src={mm} />
                <img height={"25px"} width="35px" src={wc} />
              </HStack>
            </Center>
          </Flex>
        </Stack>
      </Flex>
      <Flex p={14} flex={1} >

        <iframe
          id="myFrame"
          width={"100%"}
          height="300px"
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



const defaultSnapOrigin = "local:http://localhost:8080";

const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<"version" | string, unknown> = {}
) => {
  await (window.ethereum as any).request({
    method: "wallet_enable",
    params: [
      {
        wallet_snap: {
          [snapId]: {
            ...params,
          },
        },
      },
    ],
  });
};



const getSnaps = async (): Promise<[any]> => {
  return await (window.ethereum as any).request({
    method: "wallet_getSnaps",
  });
};

const getSnap = async (version?: string): Promise<any> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version)
    );
  } catch (e) {
    console.log("Failed to obtain installed snap", e);
    return undefined;
  }
};
