import fs from "fs";
import { LoggerFactory, WarpFactory } from "warp-contracts";
import createBrowserless from "browserless";
import getHTML from "html-get";
import Bundlr from "@bundlr-network/client";
import Arweave from "arweave";
// Spawn Chromium process once
const browserlessFactory = createBrowserless();
async function main() {
  //   let res = await (await fetch("https://node1.bundlr.network")).json();

  // Warp and Arweave initialization
  LoggerFactory.INST.logLevel("error");
  const warp = WarpFactory.forMainnet();
  const arweave = warp.arweave;
  let wallet = JSON.parse(fs.readFileSync("../wallet.json").toString());
  const walletAddress = await arweave.wallets.jwkToAddress(wallet);

  // we setup the warp contracts
  let pst = warp
    .pst("uraHHtZCp0KKgpy9xxmk3QvhMJI4jtRLQVpxNQhHVHc")
    .connect(wallet);

  let archivor = warp
    .contract("9l0EYIHlekDMHRbZusiovgcIb4hkJO-ZJ6X2fQ1x0to")
    .setEvaluationOptions({
      internalWrites: true,
    })
    .connect(wallet);

  var args = process.argv.slice(2);

  if (args[0] === "order") {
    let amount = 100;
    let order = await archivor.writeInteraction({
      function: "createOrder",
      orderAction: {
        website: "https://www.ethlisbon.org/",
        amount_to_transfer: amount,
        // 10 second
        frequency: 10,
        duration: 100,
      },
    });
    console.log("order deployed");
    console.log(order);
    process.exit(0);
  }

  const bundlr = new Bundlr.default(
    "http://node1.bundlr.network",
    "arweave",
    wallet
  );

  console.log(await bundlr.getLoadedBalance());

  // now we fetch the latest state
  let state = await reloadState(archivor);
  console.log(state);

  while (true) {
    let orders = state.openOrders;
    console.log("Init new round, there are ", orders.length, "orders");

    // THIS IS THE UPLOADER LOOP

    console.log("Entering the Uploader Loop");
    for (let [orderID, order] of orders.entries()) {
      // if it's not our epoch, we continue
      if (order.next_upload_after > Date.now() / 1000) {
        console.log("skip, nothing to do");
        continue;
      }
      if (order.balance <= 0) {
        console.log("balance is 0");
        continue;
      }

      // we upload
      try {
        // we do a drywrite first, to see if we can deploy it
        // if not, this keeps going
        let dw = await archivor.dryWrite({
          function: "declareUpload",
          declareUpload: {
            txId: "example",
            order_id: orderID,
          },
        });

        if (dw.errorMessage) {
          console.log("Dry write returned error, skipping");
          continue;
        }

        console.log("Getting website source for ", order.website);
        let data = await getWebpageSource(order.website);
        let hash = Arweave.utils.bufferTob64Url(
          await Arweave.crypto.hash(Buffer.from(data), "SHA-256")
        );

        const tags = [
          { name: "Content-Type", value: "text/html" },
          { name: "Deployer", value: walletAddress },
          { name: "App-Name", value: "archive-the-web" },
          {
            name: "Timestamp",
            value: Math.round(Date.now() / 1000).toString(),
          },
          { name: "Sig-Type", value: "arweave" },
          { name: "Sig", value: "" },
          { name: "Data-SHA256", value: hash },
          { name: "Original-URL", value: order.website },
        ];
        console.log("Deploying to Bundlr");
        const transaction = bundlr.createTransaction(data, { tags: tags });
        await transaction.sign();
        const id = (await transaction.upload()).data.id;

        console.log("Deployed to Bundlr with id", id);

        console.log("Declaring upload to contract");

        // now we tell warp we uploaded
        await archivor.writeInteraction({
          function: "declareUpload",
          declareUpload: {
            txId: id,
            order_id: orderID,
          },
        });

        console.log("Upload declared");
      } catch (e) {
        console.log("error", e);
        continue;
      }

      state = await reloadState(archivor);

      // THIS IS THE VALIDATOR LOOP
      // THIS IS THE VALIDATOR LOOP
      // THIS IS THE VALIDATOR LOOP
      // THIS IS THE VALIDATOR LOOP
      // THIS IS THE VALIDATOR LOOP

      console.log("Entering the Validator Loop");
      for (let [orderID, order] of orders.entries()) {
        let claims = order.claims;

        for (let [claimID, claim] of claims.entries()) {
          // check if we voted
          if (claim.voted[walletAddress] || claim.claimed) {
            continue;
          }

          if (claim.claim_release_timestamp < Date.now() / 1000) {
            continue;
          }

          // we fetch the tx info using the tag
          let txid = claim.claimer_tx;

          // we do a graphql query
          let res = await fetch("https://arweave.net/graphql", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query  {
            transactions(ids: ["${txid}"], sort: HEIGHT_DESC) {
                edges {
                node {
                  id
                  tags {
                    name
                    value
                  }
                  block {
                    height
                    timestamp
                  }
                  parent { id }
                  bundledIn { id }
                }
                cursor
              }
            }
          }`,
            }),
          });

          let jsonResult = await res.json();
          let tags = jsonResult.data.transactions.edges[0].node.tags;

          let hashTag = tags.filter((obj) => {
            return obj.name === "Data-SHA256";
          })[0];

          // now we get the website data
          let source = await getWebpageSource(order.website);
          // we hash it
          let hash = Arweave.utils.bufferTob64Url(
            await Arweave.crypto.hash(Buffer.from(source), "SHA-256")
          );

          // TODO check this
          if (hash != hashTag.value) {
            console.log(
              "hashes from Website and Tag do not match",
              hash,
              hashTag.value
            );
          }

          let res2 = await fetch(`https://arweave.net/${txid}`);
          let dataOnArweave = await res2.text();

          let hashDataOnArweave = Arweave.utils.bufferTob64Url(
            await Arweave.crypto.hash(Buffer.from(dataOnArweave), "SHA-256")
          );

          // TODO check this
          if (hash != hashDataOnArweave) {
            console.log(
              "hashes from data on arweave and Tag do not match",
              hash,
              hashDataOnArweave
            );
          }

          await sleep(10000);
        }
      }

      state = await reloadState(archivor);

      // THIS IS THE CLAIM LOOP
      // THIS IS THE CLAIM LOOP
      // THIS IS THE CLAIM LOOP
      // THIS IS THE CLAIM LOOP
      // THIS IS THE CLAIM LOOP
      console.log("Entering the Claiming Loop");

      for (let [orderID, order] of orders.entries()) {
        let claims = order.claims;

        for (let [claimID, claim] of claims.entries()) {
          // check if it was claimed
          if (claim.claimed) {
            continue;
          }

          if (claim.claim_release_timestamp > Date.now() / 1000) {
            continue;
          }

          try {
            let dw = await archivor.dryWrite({
              function: "claimUpload",
              claimUpload: {
                order_id: orderID,
                claim_index: claimID,
              },
            });

            if (dw.errorMessage) {
              console.log("error in dw claim, continuing");
              continue;
            }

            console.log(
              "Claiming bounty for upload with order id",
              orderID,
              "and claimID",
              claimID
            );
            await archivor.writeInteraction({
              function: "claimUpload",
              claimUpload: {
                order_id: orderID,
                claim_index: claimID,
              },
            });
          } catch (e) {
            console.log(e);
          }
        }
      }

      await sleep(30000);
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWebpageSource(url) {
  try {
    let content = await getContent(url);
    return content.html;
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}

const getContent = async (url) => {
  // create a browser context inside Chromium process
  const browserContext = browserlessFactory.createContext();
  const getBrowserless = () => browserContext;
  const result = await getHTML(url, { getBrowserless });
  // close the browser context after it's used
  await getBrowserless((browser) => browser.destroyContext());
  return result;
};

async function reloadState(archivor) {
  return (
    await archivor.viewState({
      function: "getState",
    })
  ).state;
}

(async () => {
  try {
    process.on("exit", () => {
      browserlessFactory.close();
    });

    await main();
  } catch (e) {
    // Deal with the fact the chain failed
    console.log(e);
  }
  // `text` is not available here
})();
