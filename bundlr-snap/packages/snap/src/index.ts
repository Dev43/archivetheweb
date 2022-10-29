import { OnRpcRequestHandler } from '@metamask/snap-types';
import Arweave from 'arweave';
import deepHash from 'arweave/web/lib/deepHash';
import ArweaveBundles from 'arweave-bundles';
import { providers } from 'ethers';
/**
 * Get a message from the origin. For demonstration purposes only.
 *
 * @param originString - The origin string.
 * @returns A message based on the origin.
 */
export const getMessage = (originString: string): string =>
  `Hello, ${originString}!`;

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns `null` if the request succeeded.
 * @throws If the request method is not valid for this snap.
 * @throws If the `snap_confirm` call failed.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(Arweave);

  const deps = {
    utils: Arweave.utils,
    crypto: Arweave.crypto,
    deepHash: deepHash,
  };

  const arBundles = ArweaveBundles(deps);
  console.log(arBundles);
  console.log(wallet);
  console.log(window);

  console.log(wallet.selectedAddress);
  console.log(wallet.chainId);
  console.log(await wallet.enable());

  const provider = new providers.Web3Provider(wallet as any);
  console.log(provider);
  console.log(await provider.getBlockNumber());

  const signer = provider.getSigner();
  // signer.signMessage('hi');
  // wallet
  //   .request({ method: 'eth_accounts' })
  //   .then(console.log)
  //   .catch((err) => {
  //     // Some unexpected error.
  //     // For backwards compatibility reasons, if no accounts are available,
  //     // eth_accounts will return an empty array.
  //     console.error(err);
  //   });
  switch (request.method) {
    case 'hello':
      return wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: getMessage(origin),
            description:
              'This custom confirmation is just for display purposes.',
            textAreaContent:
              'But you can edit the snap source code to make it do something, if you want to!',
          },
        ],
      });
    default:
      throw new Error('Method not found.');
  }
};
