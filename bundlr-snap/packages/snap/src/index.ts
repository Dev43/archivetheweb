import { OnRpcRequestHandler } from '@metamask/snap-types';
import Arweave from 'arweave';
import deepHash from 'arweave/web/lib/deepHash';
import ArweaveBundles from 'arweave-bundles';
import { providers } from 'ethers';
import fetch from 'isomorphic-fetch';
import { ethers } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';
import { BigNumber } from 'bignumber.js';

const BUNDLR_URL = 'https://node1.bundlr.network';
const ethSigner = {
  signatureLength: 65,
  ownerLength: 65,
  signatureType: 3,
};
const deps = {
  utils: Arweave.utils,
  crypto: Arweave.crypto,
  deepHash: deepHash,
};

const arBundles = ArweaveBundles(deps);

export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    case 'bundle_data':
      if (!request.params) {
        return;
      }
      let data = (request.params as any).data;

      await wallet.enable();

      let balance = await getBalance(wallet.selectedAddress as any, 'ethereum');

      let fb = await createFakeBundle(data);
      let bytes = (fb as any).length;
      let price = await getPrice(bytes, 'ethereum');

      let confirm = await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt: 'Bundle Data',
            description: `Please confirm the upload action`,
            textAreaContent: `You are about to upload data to Arweave using Bundlr of size ${
              data.length
            } \nYour current balance is ${balance.toString()} ETH \nPrice: ${price.toString()} ETH`,
          },
        ],
      });

      if (!confirm) {
        return;
      }

      let txID = await bundlerize(data);

      wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'inApp',
            message: `Deployed! TxID: ${txID}`,
          },
        ],
      });
      wallet.request({
        method: 'snap_notify',
        params: [
          {
            type: 'native',
            message: `Deployed! TxID: ${txID}`,
          },
        ],
      });

      return;
    default:
      throw new Error('Method not found.');
  }
};

async function createFakeBundle(data: string) {
  let newARBundle = await arBundles.createData(
    {
      data: data,
      nonce: Arweave.utils.bufferTob64Url(randomBytes(32)),
      // tags: myTags,
      signatureType: 3,
    },
    { n: Arweave.utils.bufferTob64Url(randomBytes(65)) } as any,
  );
  newARBundle.signature = Arweave.utils.bufferTob64Url(randomBytes(65));

  let encoded = encodeData(newARBundle, ethSigner);

  return encoded;
}

async function bundlerize(data: string) {
  const provider = new providers.Web3Provider(wallet as any);
  const ethWallet = provider.getSigner();

  const address = 'sign this message to connect to Bundlr.Network';
  const signedMsg = await ethWallet.signMessage(address);

  const hash = await ethers.utils.hashMessage(address);
  const recoveredKey = ethers.utils.recoverPublicKey(
    ethers.utils.arrayify(hash),
    signedMsg,
  );
  let publicKey = Buffer.from(ethers.utils.arrayify(recoveredKey));

  let newARBundle = await arBundles.createData(
    {
      data: data,
      nonce: Arweave.utils.bufferTob64Url(randomBytes(32)),
      // tags: myTags,
      signatureType: 3,
    },
    { n: 'to_change' } as any,
  );

  newARBundle.owner = Arweave.utils.bufferTob64Url(publicKey);
  let sigData = await getSignatureData(newARBundle);

  let newARBundleSigString = await ethWallet.signMessage(sigData);
  let newARBundleSig = Buffer.from(newARBundleSigString.slice(2), 'hex');
  // now we need to sign this data
  newARBundle.signature = Arweave.utils.bufferTob64Url(newARBundleSig);

  let newEncodedData: any = await encodeData(newARBundle, ethSigner);
  let deployment = await uploadBundleToBundlr('ethereum', newEncodedData);
  console.log(deployment);

  return deployment;
}

async function getBalance(address: string, currency: string) {
  const res = await (
    await fetch(BUNDLR_URL + `/account/balance/${currency}?address=${address}`)
  ).json();

  return new BigNumber(res.balance).div(new BigNumber(10).pow(18));
}

async function getPrice(bytes: number, currency: string) {
  const res = await (
    await fetch(BUNDLR_URL + `/price/${currency}/${bytes}`)
  ).text();

  return new BigNumber(res).div(new BigNumber(10).pow(18));
}

function zigzag_encode(i: any) {
  return (i >> 31) ^ (i << 1);
}

async function getSignatureData(d: any) {
  return await deepHash([
    Arweave.utils.stringToBuffer('dataitem'),
    Arweave.utils.stringToBuffer('1'),
    Arweave.utils.stringToBuffer(d.signatureType.toString()),
    Arweave.utils.b64UrlToBuffer(d.owner),
    Arweave.utils.b64UrlToBuffer(d.target),
    Arweave.utils.b64UrlToBuffer(d.nonce),
    // worry about tags later
    Arweave.utils.stringToBuffer(''),
    Arweave.utils.b64UrlToBuffer(d.data),
  ]);
}
export function byteArrayToLong(byteArray: any) {
  let value = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

export function arraybufferEqual(buf1: any, buf2: any) {
  const _buf1 = buf1.buffer;
  const _buf2 = buf2.buffer;

  if (_buf1 === _buf2) {
    return true;
  }

  if (_buf1.byteLength !== _buf2.byteLength) {
    return false;
  }

  const view1 = new DataView(_buf1);
  const view2 = new DataView(_buf2);

  let i = _buf1.byteLength;
  while (i--) {
    if (view1.getUint8(i) !== view2.getUint8(i)) {
      return false;
    }
  }

  return true;
}

async function encodeData(data: any, signer: any) {
  const _owner = Arweave.utils.b64UrlToBuffer(data.owner);

  const _target = data?.target
    ? Arweave.utils.b64UrlToBuffer(data.target)
    : null;
  const target_length = 1 + (_target?.byteLength ?? 0);
  const _anchor = data?.nonce ? Arweave.utils.b64UrlToBuffer(data.nonce) : null;
  const anchor_length = 1 + (_anchor?.byteLength ?? 0);
  const _tags = (data?.tags?.length ?? 0) > 0 ? serializeTags(data.tags) : null;
  const tags_length = 16 + (_tags ? _tags.byteLength : 0);
  const _data =
    typeof data.data === 'string'
      ? Arweave.utils.b64UrlToBuffer(data.data)
      : Arweave.utils.b64UrlToBuffer(data.data);
  const data_length = _data.byteLength;
  // const signature = Buffer.from(data.signature);
  const signature = Arweave.utils.b64UrlToBuffer(data.signature);

  // See [https://github.com/joshbenaron/arweave-standards/blob/ans104/ans/ANS-104.md#13-dataitem-format]
  const length =
    2 +
    signer.signatureLength +
    signer.ownerLength +
    target_length +
    anchor_length +
    tags_length +
    data_length;

  const bytes = Buffer.alloc(length);

  bytes.set(shortTo2ByteArray(signer.signatureType), 0);

  // we set the signature as we have it
  bytes.set(signature, 2);
  //   bytes.set;
  // Push bytes for `signature`
  //   bytes.set(new Uint8Array(signer.signatureLength).fill(0), 2);
  // // Push bytes for `id`
  // bytes.set(EMPTY_ARRAY, 32);
  // Push bytes for `owner`

  if (_owner.byteLength != signer.ownerLength) {
    throw new Error(
      `Owner must be ${signer.ownerLength} bytes, but was incorrectly ${_owner.byteLength}`,
    );
  }
  bytes.set(_owner, 2 + signer.signatureLength);

  const position = 2 + signer.signatureLength + signer.ownerLength;
  // Push `presence byte` and push `target` if present
  // 64 + OWNER_LENGTH
  bytes[position] = _target ? 1 : 0;
  if (_target) {
    if (_target.byteLength !== 32) {
      throw new Error(
        'Target must be 32 bytes but was incorrectly ${_target.byteLength}',
      );
    }
    bytes.set(_target, position + 1);
  }

  // Push `presence byte` and push `anchor` if present
  // 64 + OWNER_LENGTH
  const anchor_start = position + target_length;
  let tags_start = anchor_start + 1;
  bytes[anchor_start] = _anchor ? 1 : 0;
  if (_anchor) {
    tags_start += _anchor.byteLength;

    if (_anchor.byteLength != 32) {
      throw new Error('Anchor must be 32 bytes');
      return;
    }
    bytes.set(_anchor, anchor_start + 1);
  }

  bytes.set(longTo8ByteArray(data?.tags?.length ?? 0), tags_start);
  const bytesCount = longTo8ByteArray(_tags?.byteLength ?? 0);
  bytes.set(bytesCount, tags_start + 8);
  if (_tags) {
    bytes.set(_tags, tags_start + 16);
  }

  const data_start = tags_start + tags_length;

  bytes.set(_data, data_start);

  return bytes;
}

export function longTo8ByteArray(long: any) {
  // we want to represent the input as a 8-bytes array
  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0];

  for (let index = 0; index < byteArray.length; index++) {
    const byte = long & 0xff;
    byteArray[index] = byte;
    long = (long - byte) / 256;
  }

  return Uint8Array.from(byteArray);
}

export function shortTo2ByteArray(long: any) {
  if (long > (2 ^ (32 - 1))) throw new Error('Short too long');
  // we want to represent the input as a 8-bytes array
  const byteArray = [0, 0];

  for (let index = 0; index < byteArray.length; index++) {
    const byte = long & 0xff;
    byteArray[index] = byte;
    long = (long - byte) / 256;
  }

  return Uint8Array.from(byteArray);
}

function serializeTags(tags: any) {
  // tags = tags.map((x) => {
  //   x.name = Arweave.utils.b64UrlToString(x.name);
  //   x.value = Arweave.utils.b64UrlToString(x.value);

  //   return x;
  // });

  // console.log("new tags", tags);

  // console.log("tags to be serialized", tags);
  // const tagsParser = avro.Type.forSchema({
  //   type: "array",
  //   items: tagParserI,
  // });
  // console.log(
  //   "SHOULD BE",
  //   Arweave.utils.bufferTob64Url(Uint8Array.from(tagsParser.toBuffer(tags)))
  // );
  // return Uint8Array.from(tagsParser.toBuffer(tags));

  let byt = Buffer.from('');
  // we first add the count of tags
  byt = Buffer.concat([byt, Buffer.from([zigzag_encode(tags.length)])]);
  // BBZRWEJ3TFU1aGJXVQ5iWGxCY0hBHlFYQndMVlpsY25OcGIyNA5NUzR3TGpBAA
  for (let tag of tags) {
    let name = Buffer.from(tag.name);
    let value = Buffer.from(tag.value);
    let name_length = name.byteLength;
    let value_length = value.byteLength;

    byt = Buffer.concat([byt, Buffer.from([zigzag_encode(name_length)])]);
    byt = Buffer.concat([byt, name]);
    byt = Buffer.concat([byt, Buffer.from([zigzag_encode(value_length)])]);
    byt = Buffer.concat([byt, value]);
  }
  // we terminate it with a 0
  byt = Buffer.concat([byt, Buffer.from([zigzag_encode(0)])]);

  return byt;
}

async function uploadBundleToBundlr(currency: any, bundle: any) {
  const res3 = await fetch(BUNDLR_URL + `/tx/${currency}`, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    method: 'post',
    body: bundle,
  });

  return (await res3.json()).id;
}

function ownerToAddress(owner: any) {
  return ethers.utils.keccak256(Buffer.from(owner.slice(1))).slice(-20);
}
