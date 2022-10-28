export interface ArchivoorState {
  ticker: string;
  name: string;
  owner: string;
  balances: {
    [address: string]: number;
  };
  openOrders: [OpenOrder];
  validators: [Validator];
}

export interface OpenOrder {
  origin: string;
  balance: number;
  frequency: string;
  start_timestamp: number;
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

export interface PstResult {
  target: string;
  ticker: string;
  balance: number;
}

export type PstFunction = "transfer" | "mint" | "balance";

export type ContractResult = { state: ArchivoorState } | { result: PstResult };
