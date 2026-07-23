import { useCallback, useEffect, useState } from "react";
import type { Item } from "../components/Card/CardDetail";
import { rpcService } from "../services/rpc";

/**
 *  A custom React hook that fetches and provides information about
 * the node's RPC state.
 * 
 *  It retrieves the current RPC value, RPC data, and the best block hash
 * from the node.
 *
 * @returns An object containing the RPC value, RPC data, and the current
 * best hash from the node.
 */
export function useNodeInfo() {
  const [rpcValue, setRpcValue] = useState<string>("");
  const [rpcData, setRpcData] = useState<Item[]>([]);
  const [currentBestHash, setCurrentBestHash] = useState<string>("");
  const [trigger, setTrigger] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await rpcService.getNodeInfo();
        if (isMounted) {
          setRpcValue(data.blocks.toString());
          setRpcData([
            { label: "Rede", value: "signet" },
            { label: "Mempool Size", value: data.mempool.bytes },
            { label: "Best Block Hash", value: data.bestblockhash },
          ]);
          setCurrentBestHash(data.bestblockhash);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          console.error("Erro ao buscar informações do nó:", err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [trigger]);

  const refetch = useCallback(() => {
    setTrigger((prev) => prev + 1);
  }, []);

  return {
    rpcValue,
    rpcData,
    currentBestHash,
    isLoading,
    error,
    refetch,
  };
}
