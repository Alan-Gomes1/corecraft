from http import HTTPStatus

from fastapi import FastAPI

from .services.rpc import BitcoinRPC, BitcoinRPCError
from .utils import build_mempool_summary

app = FastAPI()
rpc = BitcoinRPC()


@app.get("/api/node", status_code=HTTPStatus.OK)
async def node():
    """
    Node snapshot:
    - getblockchaininfo (chain, blocks, headers, difficulty, bestblockhash)
    - getmempoolinfo (size, bytes, usage)
    - getnetworkinfo (subversion, connections)
    """
    try:
        block_chain = await rpc.call("getblockchaininfo")
        mempool = await rpc.call("getmempoolinfo")
        network = await rpc.call("getnetworkinfo")

        data = {
            "chain": block_chain.get("chain"),
            "blocks": block_chain.get("blocks"),
            "headers": block_chain.get("headers"),
            "difficulty": block_chain.get("difficulty"),
            "bestblockhash": block_chain.get("bestblockhash"),
            "mempool": {
                "txcount": mempool.get("size"),
                "bytes": mempool.get("bytes"),
                "usage": mempool.get("usage"),
                "maxmempool": mempool.get("maxmempool"),
                "mempoolminfee": mempool.get("mempoolminfee"),
            },
            "network": {
                "subversion": network.get("subversion"),
                "connections": network.get("connections"),
                "version": network.get("version"),
            },
        }
        return data
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar estado do node via RPC.",
            "details": str(e),
        }, HTTPStatus.BAD_GATEWAY


@app.get("/api/blocks/recent")
async def blocks_recent(quantity: int = 10):
    """
    Lista N blocos recentes com estatísticas simples.
    Usa:
      - getblockcount
      - getblockhash(height)
      - getblockheader(hash)  (leve)
      - getblockstats(hash)   (stats úteis)
    """
    n = max(1, min(quantity, 25))

    try:
        tip = int(await rpc.call("getblockcount"))
        blocks = []
        for h in range(tip, max(tip - n, -1), -1):
            block_hash = await rpc.call("getblockhash", [h])
            header = await rpc.call("getblockheader", [block_hash])
            stats = await rpc.call("getblockstats", [block_hash])

            blocks.append(
                {
                    "height": h,
                    "hash": block_hash,
                    "time": header.get("time"),
                    "mediantime": header.get("mediantime"),
                    "txs": stats.get("txs"),
                    "totalfee": stats.get("totalfee"),
                    "avgfee": stats.get("avgfee"),
                    "feerate_percentiles": stats.get("feerate_percentiles"),
                    "avgfeerate": stats.get("avgfeerate"),
                    "avg_tx_size": stats.get("avgtxsize"),
                    "total_size": stats.get("total_size"),
                }
            )

        return {"tip": tip, "items": blocks}
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar blocos recentes via RPC.",
            "details": str(e),
        }, HTTPStatus.BAD_GATEWAY


@app.get("/api/mempool/summary", status_code=HTTPStatus.OK)
async def mempool_summary():
    """
    Resumo do estado atual da mempool, incluindo:
    - contagem total de transações
    - tamanho total em bytes
    - taxa média de fee (sats/vB)
    - distribuição de taxas (low/medium/high)
    """
    try:
        mempool = await rpc.call("getmempoolinfo")
        txs = await rpc.call("getrawmempool", [True])
        data = build_mempool_summary(mempool, txs)
        return data
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar mempool.",
            "details": str(e),
        }, HTTPStatus.BAD_GATEWAY


@app.get("/api/blockchain/lag", status_code=HTTPStatus.OK)
async def blockchain_lag():
    """
    Avalia o estado de sincronização do node.
    """
    try:
        block_chain = await rpc.call("getblockchaininfo")
        blocks = block_chain.get("blocks")
        headers = block_chain.get("headers")
        lag = max((headers or 0) - (blocks or 0), 0)
        data = {"blocks": blocks, "headers": headers, "lag": lag}
        return data
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar lag da blockchain.",
            "details": str(e),
        }, HTTPStatus.BAD_GATEWAY
