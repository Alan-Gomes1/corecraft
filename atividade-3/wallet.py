# wallet.py

import os
from rpc import BitcoinRPC

rpc = BitcoinRPC(
    os.getenv("BITCOIN_RPC_URL",  "http://127.0.0.1:38332"),
    os.getenv("BITCOIN_RPC_USER", "teste"),
    os.getenv("BITCOIN_RPC_PASS", "teste"),
)


# ---------------------------------------------------------------------------
# Listagem e seleção de wallets
# ---------------------------------------------------------------------------

def list_available_wallets() -> list[str]:
    """Todas as wallets conhecidas pelo node (em disco)."""
    result = rpc.call("listwalletdir")
    return [w["name"] for w in result.get("wallets", [])]


def list_loaded_wallets() -> list[str]:
    """Wallets atualmente carregadas na memória do node."""
    return rpc.call("listwallets")


def load_wallet(wallet_name: str) -> dict:
    """Carrega a wallet se ainda não estiver carregada. Retorna info."""
    loaded = list_loaded_wallets()
    if wallet_name not in loaded:
        rpc.call("loadwallet", [wallet_name])
    return get_wallet_info(wallet_name)


def get_wallet_info(wallet_name: str) -> dict:
    """Retorna informações básicas da wallet (nome, saldo, nº de txs)."""
    info = rpc.wallet_call(wallet_name, "getwalletinfo")
    return {
        "walletname": info.get("walletname", wallet_name),
        "balance": info.get("balance", 0),
        "txcount": info.get("txcount", 0),
    }


def get_wallet_status(wallet_name: str) -> dict:
    """Saldo + número de UTXOs da wallet."""
    balance = rpc.call("getbalance", [], wallet=wallet_name)
    utxos = rpc.wallet_call(wallet_name, "listunspent", [1, 9999999])
    return {
        "wallet": wallet_name,
        "balance": balance,
        "utxos": len(utxos),
    }


# ---------------------------------------------------------------------------
# Operações de wallet (todas recebem wallet_name)
# ---------------------------------------------------------------------------

def get_utxos(wallet_name: str) -> list:
    return rpc.wallet_call(wallet_name, "listunspent", [1, 9999999])


def get_new_address(wallet_name: str) -> str:
    return rpc.wallet_call(wallet_name, "getnewaddress")


def get_balance(wallet_name: str) -> float:
    return rpc.wallet_call(wallet_name, "getbalance")


def get_change_address(wallet_name: str) -> str:
    return rpc.wallet_call(wallet_name, "getrawchangeaddress")


def sign_raw_tx(wallet_name: str, raw_tx_hex: str) -> dict:
    return rpc.wallet_call(wallet_name, "signrawtransactionwithwallet", [raw_tx_hex])


def get_transaction(wallet_name: str, txid: str) -> dict:
    return rpc.wallet_call(wallet_name, "gettransaction", [txid])

