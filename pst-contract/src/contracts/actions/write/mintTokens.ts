import { ContractResult, PstAction, ArchivoorState } from "../../types/types";

declare const ContractError;

export const mintTokens = async (
  state: ArchivoorState,
  { caller, input: { qty } }: PstAction
): Promise<ContractResult> => {
  const balances = state.balances;

  if (qty <= 0) {
    throw new ContractError("Invalid token mint");
  }

  if (!Number.isInteger(qty)) {
    throw new ContractError('Invalid value for "qty". Must be an integer');
  }

  balances[caller] ? (balances[caller] += qty) : (balances[caller] = qty);
  return { state };
};
