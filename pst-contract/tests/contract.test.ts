import fs from "fs";
import ArLocal from "arlocal";
import { JWKInterface } from "arweave/node/lib/wallet";
import path from "path";
import {
  AddressAction,
  ArchivoorState,
  ClaimUploadAction,
  DeclareUploadAction,
  OrderAction,
  VoteUploadAction,
} from "../src/contracts/types/types";
import {
  PstContract,
  PstState,
  Warp,
  LoggerFactory,
  InteractionResult,
  WarpFactory,
} from "warp-contracts";

describe("Testing the Profit Sharing Token", () => {
  let contractSrc: string;
  let archivorSrc: string;

  let wallet: JWKInterface;
  let walletAddress: string;

  let initialState: PstState;

  let arlocal: ArLocal;
  let warp: Warp;
  let pst: PstContract;
  let archivorID: any;
  let archivor: any;

  beforeAll(async () => {
    arlocal = new ArLocal(1820);
    await arlocal.start();
    LoggerFactory.INST.logLevel("error");

    warp = WarpFactory.forLocal(1820);
    ({ jwk: wallet, address: walletAddress } =
      await warp.testing.generateWallet());

    contractSrc = fs.readFileSync(
      path.join(__dirname, "../dist/pst-contract.js"),
      "utf8"
    );
    const stateFromFile: PstState = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../dist/contracts/initial-state.json"),
        "utf8"
      )
    );

    archivorSrc = fs.readFileSync(
      path.join(__dirname, "../dist/archivor-contract.js"),
      "utf8"
    );
    const archivorState: ArchivoorState = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../dist/contracts/archivor-initial-state.json"),
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

    initialState = {
      ...stateFromFile,
      ...{
        owner: walletAddress,
      },
    };

    const { contractTxId } = await warp.createContract.deploy({
      wallet,
      initState: JSON.stringify(initialState),
      src: contractSrc,
    });
    pst = warp.pst(contractTxId);
    pst.connect(wallet);

    archivorState.pst_address = contractTxId;
    // we deploy our contract
    const res = await warp.createContract.deploy({
      wallet,
      initState: JSON.stringify(archivorState),
      src: archivorSrc,
    });
    archivorID = res.contractTxId;
    archivor = warp
      .contract(archivorID)
      .setEvaluationOptions({
        internalWrites: true,
      })
      .connect(wallet);

    await warp.testing.mineBlock();

    await archivor.writeInteraction({
      function: "setMyAddress",
      myAddressAction: {
        address: archivorID,
      } as AddressAction,
    });
  });

  afterAll(async () => {
    await arlocal.stop();
  });

  it("should read pst state and balance data", async () => {
    expect(await pst.currentState()).toEqual(initialState);
    expect(
      (await pst.currentBalance("GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI"))
        .balance
    ).toEqual(1000);
    expect(
      (await pst.currentBalance("33F0QHcb22W7LwWR1iRC8Az1ntZG09XQ03YWuw2ABqA"))
        .balance
    ).toEqual(230);
  });

  it("should properly mint tokens", async () => {
    await pst.writeInteraction({
      function: "mint",
      qty: 2000,
    });

    expect((await pst.currentState()).balances[walletAddress]).toEqual(2000);
  });

  it("should properly transfer tokens", async () => {
    await pst.transfer({
      target: "GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI",
      qty: 555,
    });

    expect((await pst.currentState()).balances[walletAddress]).toEqual(
      2000 - 555
    );
    expect(
      (await pst.currentState()).balances[
        "GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI"
      ]
    ).toEqual(1000 + 555);
  });

  it("should properly perform dry write with overwritten caller", async () => {
    const { address: overwrittenCaller } = await warp.testing.generateWallet();
    await pst.transfer({
      target: overwrittenCaller,
      qty: 1000,
    });

    const result: InteractionResult<PstState, unknown> = await pst.dryWrite(
      {
        function: "transfer",
        target: "GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI",
        qty: 333,
      },
      overwrittenCaller
    );

    expect(result.state.balances[walletAddress]).toEqual(2000 - 555 - 1000);
    expect(
      result.state.balances["GH2IY_3vtE2c0KfQve9_BHoIPjZCS8s5YmSFS_fppKI"]
    ).toEqual(1000 + 555 + 333);
    expect(result.state.balances[overwrittenCaller]).toEqual(1000 - 333);
  });

  it("should create order ", async () => {
    let amount = 10;
    await archivor.writeInteraction({
      function: "createOrder",
      orderAction: {
        website: "https://google.com",
        amount_to_transfer: amount,
        // 1 second
        frequency: 2,
        duration: 100,
      } as OrderAction,
    });

    let res = await archivor.viewState({
      function: "getOrders",
    });

    expect(res.result.orders.length).toEqual(1);

    res = await archivor.viewState({
      function: "getState",
    });
    console.log(res);

    console.log(await pst.currentState());
    expect((await pst.currentState()).balances[archivorID]).toEqual(amount);
  });

  it("should declareUpload and wait for next epoch  ", async () => {
    await archivor.writeInteraction({
      function: "declareUpload",
      declareUpload: {
        txId: "oooxxxx",
        order_id: 0,
      } as DeclareUploadAction,
    });

    let res = await archivor.viewState({
      function: "getState",
    });
    console.log(JSON.stringify(res.result));

    // should not allow me to add another upload
    try {
      await archivor.writeInteraction({
        function: "declareUpload",
        declareUpload: {
          txId: "oooxxxx2",
          order_id: 0,
        } as DeclareUploadAction,
      });
      res = await archivor.viewState({
        function: "getState",
      });
    } catch (e) {}

    expect(res.result.openOrders[0].claims.length).toEqual(1);

    await sleep(2000);

    try {
      await archivor.writeInteraction({
        function: "declareUpload",
        declareUpload: {
          txId: "oooxxxx2",
          order_id: 0,
        } as DeclareUploadAction,
      });
      res = await archivor.viewState({
        function: "getState",
      });
    } catch (e) {}

    expect(res.result.openOrders[0].claims.length).toEqual(2);

    // console.log(await pst.currentState());
    // expect((await pst.currentState()).balances[archivorID]).toEqual(amount);
  });

  it("should let me claim  ", async () => {
    await archivor.writeInteraction({
      function: "claimUpload",
      claimUpload: {
        order_id: 0,
        claim_index: 0,
      } as ClaimUploadAction,
    });

    let res = await archivor.viewState({
      function: "getState",
    });
    console.log(JSON.stringify(res.result.openOrders[0].claims[0]));

    await sleep(2000);

    // should not allow me to add another upload
    try {
      await archivor.writeInteraction({
        function: "claimUpload",
        claimUpload: {
          order_id: 0,
          claim_index: 0,
        } as ClaimUploadAction,
      });
      res = await archivor.viewState({
        function: "getState",
      });
    } catch (e) {}

    res = await archivor.viewState({
      function: "getState",
    });
    console.log(res.result.openOrders[0].claims[0]);
    expect(res.result.openOrders[0].claims[0].claimed).toEqual(true);
  });

  it("should let me vote on a claim  ", async () => {
    await archivor.writeInteraction({
      function: "voteOnUpload",
      voteOnUpload: {
        order_id: 0,
        claim_index: 1,
        vote: 1,
      } as VoteUploadAction,
    });

    let res = await archivor.viewState({
      function: "getState",
    });
    console.log(res.result.openOrders[0].claims[1]);
    expect(res.result.openOrders[0].claims[1].votes_for).toEqual(1);

    try {
      await archivor.writeInteraction({
        function: "voteOnUpload",
        voteOnUpload: {
          order_id: 0,
          claim_index: 1,
          vote: 1,
        } as VoteUploadAction,
      });
    } catch (e) {}

    res = await archivor.viewState({
      function: "getState",
    });
    console.log(res.result.openOrders[0].claims[1]);
    expect(res.result.openOrders[0].claims[1].votes_for).toEqual(1);
  });

  it("should slash ", async () => {
    await archivor.writeInteraction({
      function: "declareUpload",
      declareUpload: {
        txId: "oooxxxx3",
        order_id: 0,
      } as DeclareUploadAction,
    });

    await archivor.writeInteraction({
      function: "voteOnUpload",
      voteOnUpload: {
        order_id: 0,
        claim_index: 2,
        vote: -1,
      } as VoteUploadAction,
    });

    await sleep(4000);
    await archivor.writeInteraction({
      function: "claimUpload",
      claimUpload: {
        order_id: 0,
        claim_index: 2,
      } as ClaimUploadAction,
    });

    let res = await archivor.viewState({
      function: "getState",
    });
    console.log(res.result.openOrders[0].claims[2]);
    expect(res.result.openOrders[0].claims[2].votes_against).toEqual(1);
    expect(res.result.validators[walletAddress].stake).toEqual(80);
  });

  it("should output done  ", async () => {
    console.log("done");
  });
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
