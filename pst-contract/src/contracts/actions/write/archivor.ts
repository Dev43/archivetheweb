import { SmartWeaveError } from "warp-contracts";
import {
  ArchivorContractResult,
  ArchivorAction,
  ArchivoorState,
  Claim,
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
    current_epoch: 0,
    is_active: true,
    archives: [],
    claims: [],
  });

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

  // todo ensure id is within bounds

  let newClaim = {
    validator: caller,
    claimer_tx: declareUpload.txId,
    votes_against: 0,
    votes_for: 0,
    claim_release_timestamp: SmartWeave.block.timestamp,
  } as Claim;

  state.openOrders[declareUpload.claim_index].claims.push(newClaim);

  return { state };
};

// here we actually claim the money
export const claimUpload = async (
  state: ArchivoorState,
  { caller, input: { orderAction } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  // TODO
  // check the claim is valid
  // check we are the caller
  // check votes are for and not negative
  // make the transfer
  // show claim was claimed somehow?
  return { state };
};

export const voteOnUpload = async (
  state: ArchivoorState,
  { caller, input: { orderAction } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  // check is validator
  // check the claim is fresh
  // add to vote
  return { state };
};

export const slashUpload = async (
  state: ArchivoorState,
  { caller, input: { orderAction } }: ArchivorAction
): Promise<ArchivorContractResult> => {
  // check the claim exists
  // check enough neg votes
  // slash 20%
  return { state };
};
