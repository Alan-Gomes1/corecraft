export type NodeInfo = {
  chain: string;
  blocks: number;
  headers: number;
  difficulty: number;
  bestblockhash: string;
  mempool: {
    txcount: number;
    bytes: number;
    usage: number;
    maxmempool: number;
    mempoolminfee: number;
  };
  network: {
    subversion: string;
    connections: number;
    version: number;
  };
};

export type Block = {
  hash: string;
  ts: number;
};

export type Transaction = {
  txid: string;
  ts: number;
};

export type Events = {
  blocks: Block[];
  txs: Transaction[];
};

export type LogItem = {
  id: string;
  type: "block" | "tx";
  hash: string;
  ts: number;
  origin: string;
  confirmed: boolean;
};

export type FilterType = "all" | "block" | "tx";
