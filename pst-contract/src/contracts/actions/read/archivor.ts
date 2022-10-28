import {
  ArchivoorState,
  ArchivorAction,
  ArchivorContractResult,
  ContractResult,
  PstAction,
  PstState,
} from "../../types/types";

declare const ContractError;

export const getOrders = async (
  state: ArchivoorState,
  { input: {} }: ArchivorAction
): Promise<ArchivorContractResult> => {
  const openOrders = state.openOrders;

  return { result: { orders: openOrders } };
};

export const getState = async (
  state: ArchivoorState,
  { input: {} }: ArchivorAction
): Promise<ArchivorContractResult> => {
  return { result: state };
};
