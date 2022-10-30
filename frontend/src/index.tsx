import * as React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import "./index.css";
import Dapp from "./components/Dapp";
import { Web3Modal } from "@web3modal/react";
const config = {
  projectId: "a57ce9fc687e82d3b46d7c420c9e72c4",
  theme: "dark",
  accentColor: "default",
  ethereum: {
    appName: "ethlisbon",
  },
};
// @ts-ignore
window.Buffer = Buffer;
ReactDOM.render(
  <ChakraProvider theme={theme}>
    <Router>
      <Dapp />
      <Web3Modal config={config as any} />
    </Router>
  </ChakraProvider>,
  document.getElementById("root")
);
