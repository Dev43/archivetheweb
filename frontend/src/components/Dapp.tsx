import * as React from "react";
import { ethers } from "ethers";
import { Routes, Route } from "react-router";
import { Box } from "@chakra-ui/react";
import { DEPLOYED_ADDRESS, MAINNET_ID } from "../constants/chain";
import { AddressProvider } from "../context/Address";
import { SignerProvider } from "../context/Signer";
import { ProviderProvider } from "../context/Provider";
import Navigation from "./navigation/Navigation";
import Home from "./pages/home/Home";
import Arweave from "arweave";
import { WarpFactory } from "warp-contracts";
import { useParams } from "react-router";
import Footer from "./ui/Footer";

import FourOhFour from "./pages/404/404";
import Archives from "./pages/archives/Archives";
import Archive from "./pages/archives/Archive";
import { StateProvider } from "../context/State";

const warp = WarpFactory.forMainnet();
const arweave = warp.arweave;

const Dapp: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = React.useState<string>();
  const [balance, setBalance] = React.useState<number>();
  const [txBeingSent, setTxBeingSent] = React.useState();
  const [txError, setTxError] = React.useState();
  const [networkError, setNetworkError] = React.useState<string>();
  const [provider, setProvider] = React.useState<
    ethers.providers.Web3Provider | ethers.providers.JsonRpcProvider
  >();
  const [signer, setSigner] = React.useState<ethers.Signer>();
  const [state, setstate] = React.useState<any>(null);

  const resetState = () => {
    console.log("resetting state");
    setSelectedAddress(undefined);
    setBalance(undefined);
    setTxBeingSent(undefined);
    setTxError(undefined);
    setNetworkError(undefined);
    setProvider(undefined);
    setstate(undefined);
  };

  const checkNetwork = () => {
    if ((window.ethereum as any).networkVersion === MAINNET_ID) {
      return true;
    }

    setNetworkError("Please connect Metamask to Rinkeby bossman");
    return false;
  };

  React.useEffect(() => {
    initializeState();
    return () => {};
  }, []);

  const initializeState = async () => {
    let arch = await warp.contract(DEPLOYED_ADDRESS).setEvaluationOptions({
      internalWrites: true,
    });

    let state = (await arch.viewState({
      function: "getState",
    })).state;

    setstate(state);
  };

  const initializeProvider = async () => {
    const infuraProvider = new ethers.providers.StaticJsonRpcProvider(
      "https://mainnet.infura.io/v3/d7967a01bedf490c8482c36acaee4dae"
    );
    setProvider(infuraProvider);
  };

  const initializeEthers = () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    setSigner(provider.getSigner(0));
  };

  const dismissNetworkError = () => {
    setNetworkError(undefined);
  };

  const dismissTxError = () => {
    setTxError(undefined);
  };

  const listenForAccountChange = (): void => {
    (window.ethereum as any).on("accountsChanged", ([newAddress]: any) => {
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the 'Connected
      // list of sites allowed access to your addresses' (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined) {
        return resetState(); // Kind of funky, just stops execution of setSelectedAddress
      }

      setSelectedAddress(newAddress);
    });
  };

  const listenForNetworkChange = (): void => {
    // We reset the dapp state if the network is changed
    (window.ethereum as any).on("networkChanged", () => {
      resetState();
    });
  };

  const connectWallet = async () => {
    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!checkNetwork()) {
      return;
    }

    setSelectedAddress(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    listenForAccountChange();

    listenForNetworkChange();
  };

  React.useEffect(
    () => {
      if (selectedAddress) {
        initializeEthers();
      }
    },
    [selectedAddress]
  );

  React.useEffect(() => {
    initializeProvider();
  }, []);
  React.useEffect(() => {
    initializeState();
  }, []);

  return (
    <StateProvider value={state}>
      <ProviderProvider value={provider}>
        <SignerProvider value={signer}>
          <AddressProvider value={selectedAddress}>
            <Navigation connectWallet={connectWallet} />
            <Box pb={"300px"}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/archives" element={<Archives />} />
                <Route path="/archives/*" element={<Archive />} />
                <Route path="*" element={<FourOhFour />} />
              </Routes>
            </Box>
            <Footer />
          </AddressProvider>
        </SignerProvider>
      </ProviderProvider>
    </StateProvider>
  );
};

export default Dapp;
