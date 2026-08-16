import { useEffect, useState } from "react";
import type { Events } from "../types/rpc";

/**
 * A custom React hook that connects to a server-sent events (SSE) stream
 * to receive the latest events related to blocks and transactions.
 *
 * @returns An array of Event objects representing the latest events
 * received from the SSE stream.
 */
export default function useLatestEvents(): Events {
  const [filteredLogs, setFilteredLogs] = useState<Events>({
    blocks: [],
    txs: [],
  });

  useEffect(() => {
    const eventSource = new EventSource(import.meta.env.VITE_EVENTS_STREAM_URL);
    eventSource.onerror = (error) => {
      console.error("Connection error: ", error);
      eventSource.close();
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setFilteredLogs((prev) => ({
        blocks: [...(prev.blocks || []), ...(data.blocks || [])],
        txs: [...(prev.txs || []), ...(data.txs || [])],
      }));
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return filteredLogs;
}
