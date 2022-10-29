import { getOrders, getState } from "./actions/read/archivor";
import {
  claimUpload,
  createOrder,
  declareUpload,
  setMyAddress,
  voteOnUpload,
} from "./actions/write/archivor";
import {
  ArchivoorState,
  ArchivorContractResult,
  ArchivorAction,
} from "./types/types";

declare const ContractError;

export async function handle(
  state: ArchivoorState,
  action: ArchivorAction
): Promise<ArchivorContractResult> {
  const input = action.input;

  switch (input.function) {
    case "setMyAddress":
      return await setMyAddress(state, action);
    case "createOrder":
      return await createOrder(state, action);
    case "claimUpload":
      return await claimUpload(state, action);
    case "declareUpload":
      return await declareUpload(state, action);
    case "voteOnUpload":
      return await voteOnUpload(state, action);
    // TODO add a signup validate

    // view
    case "getOrders":
      return await getOrders(state, action);
    case "getState":
      return await getState(state, action);

    default:
      throw new ContractError(
        `No function supplied or function not recognized: "${input.function}"`
      );
  }
}
