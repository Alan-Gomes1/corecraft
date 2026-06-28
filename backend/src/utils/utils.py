from .internal_types import MempoolInfo, RawMempool

SATOSHIS_PER_BTC = 100_000_000
LOW_FEE_RATE = 10
HIGH_FEE_RATE = 50


def ok(data: dict):
    """
    Retorna uma resposta JSON de sucesso.

    Args:
        data (dict): Dados a serem retornados na resposta JSON.

    Returns:
        Response: Resposta JSON de sucesso.
    """
    return jsonify({"ok": True, "data": data})


def fail(message: str, details: str | None = None, code: int = 400):
    """
    Retorna uma resposta JSON de erro.

    Args:
        message (str): Mensagem de erro.
        details (str, optional): Detalhes adicionais do erro.
        code (int, optional): Código HTTP da resposta.

    Returns:
        Response: Resposta JSON de erro.
    """
    payload: PayloadError = {"ok": False, "error": {"message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return jsonify(payload), code


def btc_to_sat_vb(fee_btc: float, vsize: int) -> float:
    """
    Converte uma taxa de fee de BTC para satoshis por vbyte.

    Args:
        fee_btc (float): Taxa de fee em BTC.
        vsize (int): Tamanho virtual da transação em vbytes.

    Returns:
        float: Taxa de fee em satoshis por vbyte.
    """
    if not fee_btc or not vsize:
        return 0.0
    return (fee_btc * SATOSHIS_PER_BTC) / vsize


def classify_fee_rate(fee_rate: float) -> str:
    """
    Classifica a taxa de fee em categorias.

    Args:
        fee_rate (float): Taxa de fee em satoshis por vbyte.

    Returns:
        str: Classificação da taxa de fee ("low", "medium", "high").
    """
    if fee_rate < LOW_FEE_RATE:
        return "low"
    if fee_rate <= HIGH_FEE_RATE:
        return "medium"
    return "high"


def build_mempool_summary(
    mempool_info: MempoolInfo, txs: dict[str, RawMempool]
) -> dict:
    """
    Constrói um resumo do estado atual da mempool, incluindo estatísticas
    de taxas.

    Args:
        mempool_info (MempoolInfo): Informações gerais da mempool.
        txs (dict[str, RawMempool]): Transações na mempool.

    Returns:
        dict: Resumo do estado da mempool, incluindo estatísticas de taxas.
    """
    fee_rates: list[float] = []
    fee_distribution: dict[str, int] = {"low": 0, "medium": 0, "high": 0}

    for _, tx in txs.items():
        vsize: int = tx.get("vsize", 0)
        fee_btc: float = tx.get("fees", {}).get("base", 0)
        fee_rate: float = btc_to_sat_vb(fee_btc, vsize)
        fee_rates.append(fee_rate)
        fee_distribution[classify_fee_rate(fee_rate)] += 1

    total_vsize: int = mempool_info.get("bytes", 0)
    avg_fee_rate: float = sum(fee_rates) / len(fee_rates) if fee_rates else 0

    return {
        "tx_count": mempool_info.get("size", len(fee_rates)),
        "total_vsize": total_vsize,
        "avg_fee_rate": round(avg_fee_rate, 2),
        "min_fee_rate": round(min(fee_rates, default=0), 2),
        "max_fee_rate": round(max(fee_rates, default=0), 2),
        "fee_distribution": fee_distribution,
    }
