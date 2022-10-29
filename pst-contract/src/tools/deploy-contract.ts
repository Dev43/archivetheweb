import { AddressAction } from "@/contracts/types/types";
import fs from "fs";
import path from "path";
import { LoggerFactory, WarpFactory } from "warp-contracts";

// note: remember to build the contract first - yarn build:contracts
(async () => {
  // Warp and Arweave initialization
  LoggerFactory.INST.logLevel("error");
  const warp = WarpFactory.forMainnet();
  const arweave = warp.arweave;

  // generating Arweave wallet
  const jwk = JSON.parse(fs.readFileSync("../wallet.json").toString());
  const walletAddress = await arweave.wallets.jwkToAddress(jwk);

  // Loading contract source and initial state from files
  const contractSrc = fs.readFileSync(
    path.join(__dirname, "../../dist/pst-contract.js"),
    "utf8"
  );
  const stateFromFile = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../dist/contracts/initial-state.json"),
      "utf8"
    )
  );
  const archivorSrc = fs.readFileSync(
    path.join(__dirname, "../../dist/archivor-contract.js"),
    "utf8"
  );
  const archivorState = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../dist/contracts/archivor-initial-state.json"),
      "utf8"
    )
  );

  archivorState.validators = {
    [walletAddress]: {
      stake: 100,
      address: walletAddress,
      address_type: "arweave",
      reward_address: walletAddress,
      is_verified: true,
    },
  };

  const initialState = {
    ...stateFromFile,
    ...{
      owner: walletAddress,
    },
  };

  // Deploying contract
  console.log("Deployment started");
  const result = await warp.createContract.deploy({
    wallet: jwk,
    initState: JSON.stringify(initialState),
    src: contractSrc,
  });

  console.log("PST Deployment completed: ", {
    ...result,
    sonar: `https://sonar.warp.cc/#/app/contract/${result.contractTxId}`,
  });

  archivorState.pst_address = result.contractTxId;

  let archivorResult = await warp.createContract.deploy({
    wallet: jwk,
    initState: JSON.stringify(archivorState),
    src: archivorSrc,
  });

  console.log("Archivor Deployment completed: ", {
    ...result,
    sonar: `https://sonar.warp.cc/#/app/contract/${archivorResult.contractTxId}`,
  });

  let archivor = warp
    .contract(archivorResult.contractTxId)
    .setEvaluationOptions({
      internalWrites: true,
    })
    .connect(jwk);

  // we set our own address
  let res = await archivor.writeInteraction({
    function: "setMyAddress",
    myAddressAction: {
      address: archivorResult.contractTxId,
    } as AddressAction,
  });

  console.log(res);

  // then do the same with the rest
})();
