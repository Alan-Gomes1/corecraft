import os
from http import HTTPStatus

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services.rpc import BitcoinRPC, BitcoinRPCError
from .utils import build_mempool_summary

load_dotenv()

app = FastAPI()

allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [
    origin.strip()
    for origin in allowed_origins_raw.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials="*" not in allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/api/blocks/recent", status_code=HTTPStatus.OK)
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


@app.get("/api/block/{blockhash}", status_code=HTTPStatus.OK)
async def block(blockhash: str, verbosity: int = 1):
    """
    Resumo de um bloco por hash.
    """
    try:
        block = await rpc.call("getblock", [blockhash, verbosity])
        data = {
            "hash": block.get("hash"),
            "height": block.get("height"),
            "confirmations": block.get("confirmations"),
            "time": block.get("time"),
            "nTx": block.get("nTx"),
            "size": block.get("size"),
            "weight": block.get("weight"),
            "version": block.get("version"),
            "previousblockhash": block.get("previousblockhash"),
            "nextblockhash": block.get("nextblockhash"),
            "tx": block.get("tx")[:20],
        }
        return data
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar bloco.",
            "details": str(e),
        }, HTTPStatus.BAD_GATEWAY


@app.get("/api/tx/{txid}", status_code=HTTPStatus.OK)
async def api_tx(txid: str, verbose: bool = True):
    """
    Consulta uma transação por txid.
    """
    try:
        tx = await rpc.call("getrawtransaction", [txid, verbose])
        data = {
            "txid": tx.get("txid"),
            "hash": tx.get("hash"),
            "version": tx.get("version"),
            "size": tx.get("size"),
            "vsize": tx.get("vsize"),
            "weight": tx.get("weight"),
            "locktime": tx.get("locktime"),
            "vin": tx.get("vin"),
            "vout": tx.get("vout"),
            "confirmations": tx.get("confirmations", 0),
            "blockhash": tx.get("blockhash"),
            "time": tx.get("time"),
            "blocktime": tx.get("blocktime"),
        }
        return data
    except BitcoinRPCError as e:
        return {
            "error": "Falha ao consultar transação.",
            "details": str(e)
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
