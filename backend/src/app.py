from fastapi import FastAPI

from .services.rpc import BitcoinRPC, BitcoinRPCError
from .utils import build_mempool_summary

app = FastAPI()
rpc = BitcoinRPC()


@app.get("/api/mempool/summary")
def api_mempool_summary():
    """
    Resumo do estado atual da mempool, incluindo:
    - contagem total de transações
    - tamanho total em bytes
    - taxa média de fee (sats/vB)
    - distribuição de taxas (low/medium/high)
    """
    try:
        mempool = rpc.call("getmempoolinfo")
        txs = rpc.call("getrawmempool", [True])
        data = build_mempool_summary(mempool, txs)
        return data
    except BitcoinRPCError as e:
        return {"error": "Falha ao consultar mempool.", "details": str(e)}, 502
