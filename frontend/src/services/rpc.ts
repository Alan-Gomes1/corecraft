import apiRPC from "./api";

/**
 * Service for interacting with the RPC API.
 */
export const rpcService = {
  /**
   * Fetches information about the RPC API.
   * 
   * @param url The endpoint URL.
   * @returns A promise that resolves to the node information.
   */
  async getRpcInfo<T>(url: string): Promise<T> {
    const response = await apiRPC.get<T>(url);
    const data = await response.data;
    return data;
  },
};
