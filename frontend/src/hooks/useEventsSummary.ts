import { rpcService } from "../services/rpc";
import { useEffect, useState } from "react";
import type { EventsSummary, Item } from "../types";

/**
 * A custom React hook that fetches and provides summary information about events.
 * @returns An array of items representing the event summary data.
 */
export function useEventsSummary(): Item[] {
  const [summaryData, setSummaryData] = useState<Item[]>([]);

  useEffect(() => {
    async function loadSummary() {
      try {
        const data =
          await rpcService.getRpcInfo<EventsSummary>("/events/summary");
        setSummaryData([
          { label: "Blocos Vistos", value: data.blocks_observed },
          { label: "Txs Observadas", value: data.txs_observed },
          { label: "Último Evento", value: data.last_event_time },
          { label: "Tx/s", value: data.tx_per_second },
        ]);
      } catch (err) {
        console.error("Error loading events summary:", err);
      }
    }

    loadSummary();
  }, []);

  return summaryData;
}
