from http import HTTPStatus

from fastapi import FastAPI

from .services.rpc import BitcoinRPC, BitcoinRPCError
from .utils import build_mempool_summary

app = FastAPI()
rpc = BitcoinRPC()


@app.get("/api/node", status_code=HTTPStatus.OK)
async def api_node():
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
