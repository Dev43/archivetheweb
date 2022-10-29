import Arweave from "arweave";
import fetch from "isomorphic-fetch";
import fs from "fs";

async function main() {
  //   let res = await (await fetch("https://node1.bundlr.network")).json();

  let arweave = Arweave.init({ host: "arweave.net" });

  let wallet = JSON.parse(
    fs
      .readFileSync(
        "./arweave-keyfile-2NbYHgsuI8uQcuErDsgoRUCyj9X2wZ6PBN6WTz9xyu0.json"
      )
      .toString()
  );
}

(async () => {
  try {
    await main();
  } catch (e) {
    // Deal with the fact the chain failed
    console.log(e);
  }
  // `text` is not available here
})();
