import type { NodeInfo } from "../types/rpc";
import apiRPC from "./api";

/**
 * Service for interacting with the RPC API.
 */
export const rpcService = {
  /**
   * Fetches information about the node from the RPC API.
   * @returns A promise that resolves to the node information.
   */
  async getNodeInfo(): Promise<NodeInfo> {
    const response = await apiRPC.get("/node");
    const data = await response.data;
    return data;
  },
};
