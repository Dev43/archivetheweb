import { SmartWeaveError } from "warp-contracts";
import {
  ArchivorContractResult,
  ArchivorAction,
  ArchivoorState,
  Claim,
  OpenOrder,
} from "../../types/types";

declare const ContractError;

// need to get

/* 

data upload info

url
timestamp
hash of data (ifps CID?)
address that deployed it (ETH address + signature that he owns the address)
address where he wants the claim to go to
The person needs to send the TX ID (bundle ID??) where he uploaded the data
 => means going through the bundle and fetching the right tx

 we will need a validator to validate whether or not all of this is true -- like kyve


The contract gets the TX and then checks

-The URL
-The hash of the data
-The timestamp
-The address the person wants the tokens to go to
- whether this was done in this epoch or not


do we need an init_claim function? where the claim goes into an array, then if not validators deny, 
they get the pst?
*/
export const setMyAddress = async (
  state: ArchivoorState,
  { caller, input: { myAddressAction } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  if (state.my_address != "") {
    throw new Error("my address is already set");
  }
  state.my_address = myAddressAction.address;
  return { state };
};

export const createOrder = async (
  state: ArchivoorState,
  { caller, input: { orderAction } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  // TODO implement approve/transferFrom, for now we simply mint some tokens
  // for the sake of time
  await SmartWeave.contracts.write(state.pst_address, {
    function: "mint",
    to: state.my_address,
    qty: orderAction.amount_to_transfer,
  });

  state.openOrders.push({
    website: orderAction.website,
    origin: caller,
    balance: orderAction.amount_to_transfer,
    frequency: orderAction.frequency,
    duration: orderAction.duration,
    next_upload_after: now(),
    is_active: true,
    archives: [],
    claims: [],
  } as OpenOrder);

  return { state };
};

// export const createOrderDelegated = async (
//   state: ArchivoorState,
//   { caller, input: { orderAction } }: ArchivorAction
// ): Promise<ArchivorContractResult> => {
//

//   return { state };
// };

export const declareUpload = async (
  state: ArchivoorState,
  { caller, input: { declareUpload } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  // TODO check if the validator exists in our state

  if (state.validators[caller] === undefined) {
    throw new Error("validator not in pool");
  }

  if (declareUpload.order_id > state.openOrders.length) {
    throw new Error("claim does not exist");
  }

  let order = state.openOrders[declareUpload.order_id];

  if (order.next_upload_after > now()) {
    throw new Error("already a claim, wait for next epoch");
  }

  let newClaim = {
    validator: caller,
    claimer_tx: declareUpload.txId,
    votes_against: 0,
    votes_for: 0,
    // for now only 1 second for testing purposes
    claim_release_timestamp: now() + 3,
    claimed: false,
    voted: {},
  } as Claim;

  order.claims.push(newClaim);
  order.next_upload_after = now() + order.frequency;

  return { state };
};

// here we actually claim the money
export const claimUpload = async (
  state: ArchivoorState,
  { caller, input: { claimUpload } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  if (claimUpload.order_id > state.openOrders.length) {
    throw new Error("order does not exist");
  }

  let order = state.openOrders[claimUpload.order_id];

  if (order.balance <= 0) {
    throw new Error("not enough balance");
  }

  if (claimUpload.claim_index > order.claims.length) {
    throw new Error("claim does not exist");
  }
  // check the claim is valid
  let claim = order.claims[claimUpload.claim_index];

  let validator = state.validators[caller];

  if (validator == undefined) {
    throw new Error("needs to be validator");
  }

  if (claim.claimed) {
    throw new Error("already claimed");
  }

  if (claim.claim_release_timestamp > now()) {
    throw new Error("cannot claim yet");
  }

  if (claim.votes_for - claim.votes_against < 0) {
    // SLASH
    validator.stake -= 20;
    claim.claimed = true;
    return { state };
  }

  // otherwise we send the money
  await SmartWeave.contracts.write(state.pst_address, {
    function: "transfer",
    target: validator.reward_address,
    qty: 1,
  });

  claim.claimed = true;
  order.balance -= 1;

  return { state };
};

export const voteOnUpload = async (
  state: ArchivoorState,
  { caller, input: { voteOnUpload } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  let order = state.openOrders[voteOnUpload.order_id];

  if (voteOnUpload.claim_index > order.claims.length) {
    throw new Error("claim does not exist");
  }
  let claim = order.claims[voteOnUpload.claim_index];

  if (claim.validator != caller) {
    throw new Error("unauthorized");
  }

  let validator = state.validators[caller];
  if (validator == undefined) {
    throw new Error("needs to be validator");
  }

  if (claim.claimed) {
    throw new Error("already claimed");
  }

  if (claim.claim_release_timestamp < now()) {
    throw new Error("cannot vote");
  }

  if (claim.voted[caller]) {
    throw new Error("already voted");
  }

  if (voteOnUpload.vote < 0) {
    claim.votes_against += 1;
  } else {
    claim.votes_for += 1;
  }
  claim.voted[caller] = true;
  return { state };
};

function now() {
  return SmartWeave.block.timestamp;
}
