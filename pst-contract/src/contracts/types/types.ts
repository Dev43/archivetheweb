export interface PstState {
  ticker: string;
  name: string;
  owner: string;
  balances: {
    [address: string]: number;
  };
}

export interface ArchivoorState {
  openOrders: [OpenOrder];
  validators: [Validator];
  pst_address: string;
  my_address: string;
}

export interface OpenOrder {
  origin: string;
  // admin_address: string;
  // admin_address_type: string;
  balance: number;
  frequency: number;
  duration: number;
  current_epoch: number;
  website: string;
  is_active: boolean;
  archives: [string];
  claims: [Claim];
}

export interface Claim {
  validator: string;
  claimer_tx: string;
  votes_for: number;
  votes_against: number;
  claim_release_timestamp: number;
}

export interface Validator {
  stake: number;
  address: string;
  address_type: string;
  reward_address: string;
  is_verified: boolean;
}
export interface PstAction {
  input: PstInput;
  caller: string;
}
export interface PstInput {
  function: PstFunction;
  target: string;
  qty: number;
}

export interface ArchivorInput {
  function: ArchivorFunction;

  // new ones
  myAddressAction: AddressAction;
  orderAction: OrderAction;
  declareUpload: DeclareUploadAction;
  claimUpload: OrderAction;
  voteOnUpload: OrderAction;
  slashUpload: OrderAction;
}

export interface ArchivorAction {
  input: ArchivorInput;
  caller: string;
}

export interface OrderAction {
  website: string;
  // only ARC for now
  amount_to_transfer: number;
  // frequency would be in seconds!
  frequency: number;
  // in seconds
  duration: number;
}

export interface AddressAction {
  address: string;
}

export interface DeclareUploadAction {
  txId: string;
  claim_index: number;
}
export interface PstResult {
  target: string;
  ticker: string;
  balance: number;
}
export interface ArchivorResult {
  orders: [OpenOrder];
}
export type PstFunction = "transfer" | "mint" | "balance";
export type ArchivorFunction =
  | "createOrder"
  | "claimUpload"
  | "voteOnUpload"
  | "declareUpload"
  | "slashUpload"
  | "getOrders"
  | "setMyAddress"
  | "getState";

export type ContractResult = { state: PstState } | { result: PstResult };
export type ArchivorContractResult =
  | { state: ArchivoorState }
  | { result: ArchivorResult | ArchivoorState };
