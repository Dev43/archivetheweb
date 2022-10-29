import { OnRpcRequestHandler } from '@metamask/snap-types';
import Arweave from 'arweave';
import deepHash from 'arweave/web/lib/deepHash';
import ArweaveBundles from 'arweave-bundles';
import { providers } from 'ethers';
import fetch from 'isomorphic-fetch';

const BUNDLR_URL = 'https://node1.bundlr.network';

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
  // console.log(arBundles);
  // console.log(wallet);
  // console.log(window);

  // console.log(wallet.selectedAddress);
  // console.log(wallet.chainId);
  // console.log(await wallet.enable());

  // const provider = new providers.Web3Provider(wallet as any);
  // console.log(provider);
  // console.log(await provider.getBlockNumber());

  // const signer = provider.getSigner();

  switch (request.method) {
    case 'bundle_data':
      if (!request.params) {
        return;
      }
      let data = (request.params as any).data;
      //

      wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: 'Bundle Data',
            description: `You are about to bundle data of size ${data.length}`,
            textAreaContent: (data as string).substring(0, 10) + '...',
          },
        ],
      });

      wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message: `Hello, world!`,
          },
        ],
      });
      wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'native',
            message: `Hello, world!`,
          },
        ],
      });

      return;
    default:
      throw new Error('Method not found.');
  }
};
