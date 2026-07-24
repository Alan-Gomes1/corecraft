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
