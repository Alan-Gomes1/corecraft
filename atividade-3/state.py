# state.py

state = {
    "current_txid": None,
    "status": "idle",
    "seen_in_mempool": False,
    "confirmed": False,
    "block_hash": None,
    # novos campos
    "selected_wallet": None,
    "tx_wallet": None,   # wallet usada para enviar a tx atual
    "sent_at": None,     # timestamp (float) do broadcast
}
