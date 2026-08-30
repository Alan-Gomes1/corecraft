import { useMemo } from "react";
import type { Events, FilterType, LogItem } from "../types/rpc";

/**
 * Processes raw events and returns logs filtered by type and search query.
 *
 * Logs are combined, sorted from newest to oldest, and normalized to the
 * `LogItem` format.
 *
 * @param rawEvents Raw event parameters and filters applied to the logs.
 * @param filterType Raw block and transaction events.
 * @param searchQuery Text used to search by hash.
 * @returns A list of processed and filtered logs.
 */
export function useLogs(
  rawEvents: Events,
  filterType: FilterType,
  searchQuery: string,
) {
  const logs = useMemo<LogItem[]>(() => {
    const blockLogs: LogItem[] = (rawEvents.blocks || []).map((b) => ({
      id: `block-${b.hash}`,
      type: "block",
      hash: b.hash,
      ts: b.ts,
      origin: "ZMQ Stream",
      confirmed: true,
    }));

    const txLogs: LogItem[] = (rawEvents.txs || []).map((t) => ({
      id: `tx-${t.txid}`,
      type: "tx",
      hash: t.txid,
      ts: t.ts,
      origin: "Mempool",
      confirmed: false,
    }));

    const combined = [...blockLogs, ...txLogs].sort((a, b) => b.ts - a.ts);

    return combined.filter((log) => {
      const matchesType = filterType === "all" || log.type === filterType;
      const matchesSearch =
        !searchQuery.trim() ||
        log.hash.toLowerCase().includes(searchQuery.toLowerCase().trim());

      return matchesType && matchesSearch;
    });
  }, [rawEvents, filterType, searchQuery]);

  return logs;
}
