# backend.py

import time

from flask import Flask, Blueprint, request, jsonify, send_file

import wallet as wallet_module
from tx_builder import build_transaction
from zmq_listener import start_zmq_listeners
from state import state
from rpc import BitcoinRPC

import os

app = Flask(__name__)

api = Blueprint("api", __name__)

rpc = BitcoinRPC(
    os.getenv("BITCOIN_RPC_URL",  "http://127.0.0.1:38332"),
    os.getenv("BITCOIN_RPC_USER", "teste"),
    os.getenv("BITCOIN_RPC_PASS", "teste"),
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MEMPOOL_WARN_SECONDS = 120  # 2 minutos


def _interpret_tx(txid: str, wallet_name: str | None) -> dict:
    """
    Consulta gettransaction via wallet e devolve dados técnicos + interpretação.
    """
    sent_at = state.get("sent_at")
    age_seconds = round(time.time() - sent_at, 1) if sent_at else None

    if not wallet_name:
        return {
            "txid": txid,
            "wallet": None,
            "status": "unknown",
            "confirmed": False,
            "confirmations": 0,
            "block_hash": None,
            "age_seconds": age_seconds,
            "message": None,
            "warning": "Nenhuma wallet selecionada. Selecione uma wallet antes de consultar.",
        }

    try:
        info = wallet_module.get_transaction(wallet_name, txid)
    except Exception as e:
        return {
            "txid": txid,
            "wallet": wallet_name,
            "status": "unknown",
            "confirmed": False,
            "confirmations": 0,
            "block_hash": None,
            "age_seconds": age_seconds,
            "message": None,
            "warning": f"Transação não localizada na wallet selecionada. ({e})",
        }

    conf = int(info.get("confirmations", 0) or 0)
    bh = info.get("blockhash")

    if conf > 0 and bh:
        return {
            "txid": txid,
            "wallet": wallet_name,
            "status": "confirmed",
            "confirmed": True,
            "confirmations": conf,
            "block_hash": bh,
            "age_seconds": age_seconds,
            "message": "Transação confirmada em bloco.",
            "warning": None,
        }

    # Ainda na mempool (ou broadcast recente)
    warning = None
    if age_seconds and age_seconds > MEMPOOL_WARN_SECONDS:
        warning = f"Transação está na mempool há mais de {int(age_seconds)}s ({int(age_seconds)//60} min)."

    in_mempool = state.get("seen_in_mempool") or state.get("status") == "mempool"

    if in_mempool:
        return {
            "txid": txid,
            "wallet": wallet_name,
            "status": "mempool",
            "confirmed": False,
            "confirmations": 0,
            "block_hash": None,
            "age_seconds": age_seconds,
            "message": "Transação aceita na mempool, aguardando inclusão em bloco.",
            "warning": warning,
        }

    return {
        "txid": txid,
        "wallet": wallet_name,
        "status": "broadcast",
        "confirmed": False,
        "confirmations": 0,
        "block_hash": None,
        "age_seconds": age_seconds,
        "message": "Transação enviada ao node, aguardando aceitação na mempool.",
        "warning": warning,
    }


# ---------------------------------------------------------------------------
# Rotas
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    """
    Serve o frontend no próprio Flask.
        http://127.0.0.1:5000/
    """
    return send_file("frontend.html")


# ── Wallets ─────────────────────────────────────────────────────────────────

@api.route("/wallets", methods=["GET"])
def get_wallets():
    try:
        available = wallet_module.list_available_wallets()
        loaded = wallet_module.list_loaded_wallets()
        selected = state.get("selected_wallet")

        # Auto-seleciona a única wallet disponível se ainda não há seleção
        if not selected and len(available) == 1:
            name = available[0]
            wallet_module.load_wallet(name)
            state["selected_wallet"] = name
            selected = name

        return jsonify({
            "available_wallets": available,
            "loaded_wallets": loaded,
            "selected_wallet": selected,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route("/wallet/select", methods=["POST"])
def select_wallet():
    data = request.get_json(silent=True) or {}
    wallet_name = data.get("wallet")

    if not wallet_name:
        return jsonify({"error": "Campo obrigatório: wallet"}), 400

    try:
        available = wallet_module.list_available_wallets()
        if wallet_name not in available:
            return jsonify({"error": f"Wallet '{wallet_name}' não encontrada."}), 404

        info = wallet_module.load_wallet(wallet_name)
        state["selected_wallet"] = wallet_name

        return jsonify({
            "selected_wallet": wallet_name,
            "wallet_info": info,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route("/wallet/status", methods=["GET"])
def wallet_status():
    wallet_name = state.get("selected_wallet")
    if not wallet_name:
        return jsonify({"error": "Nenhuma wallet selecionada."}), 400

    try:
        status_data = wallet_module.get_wallet_status(wallet_name)
        return jsonify(status_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Transações ───────────────────────────────────────────────────────────────

@api.route("/send", methods=["POST"])
def send_tx():
    try:
        print("\n>>> ENTROU NO /send (POST)")
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "JSON inválido ou ausente"}), 400

        to_address = data.get("address")
        amount = data.get("amount")

        if not to_address or amount is None:
            return jsonify({"error": "Campos obrigatórios: address, amount"}), 400

        amount = float(amount)

        wallet_name = state.get("selected_wallet")
        if not wallet_name:
            return jsonify({"error": "Nenhuma wallet selecionada. Use POST /wallet/select primeiro."}), 400

        print(f"Construindo TX -> wallet={wallet_name} address={to_address} amount={amount}")

        # 1) Build raw tx
        raw_tx = build_transaction(to_address, amount, wallet_name)
        print("Raw TX gerada (hex, início):", raw_tx[:80] + "...")

        # 2) Sign via wallet
        signed = wallet_module.sign_raw_tx(wallet_name, raw_tx)
        if not signed.get("complete"):
            raise Exception(f"Falha ao assinar TX: {signed}")

        signed_tx = signed["hex"]

        # 3) Broadcast (chamada global do node, não precisa de wallet)
        txid = rpc.call("sendrawtransaction", [signed_tx])
        print("✅ TX enviada! txid =", txid)

        now = time.time()
        state["current_txid"] = txid
        state["status"] = "broadcast"
        state["seen_in_mempool"] = False
        state["confirmed"] = False
        state["block_hash"] = None
        state["tx_wallet"] = wallet_name
        state["sent_at"] = now

        # Checa se já entrou na mempool imediatamente
        try:
            rpc.call("getmempoolentry", [txid])
            state["seen_in_mempool"] = True
            state["status"] = "mempool"
            print("[RPC mempool] ✅ tx já está na mempool")
        except Exception:
            pass

        return jsonify({"txid": txid, "wallet": wallet_name})

    except Exception as e:
        print("❌ ERRO no /send:", e)
        return jsonify({"error": str(e)}), 500


@api.route("/tx/<txid>", methods=["GET"])
def tx_status(txid):
    wallet_name = state.get("tx_wallet") or state.get("selected_wallet")
    return jsonify(_interpret_tx(txid, wallet_name))


@api.route("/status", methods=["GET"])
def status():
    """Estado global da última transação acompanhada pelo ZMQ."""
    try:
        cur = state.get("current_txid")
        wallet_name = state.get("tx_wallet") or state.get("selected_wallet")

        if state.get("seen_in_mempool") and cur and not state.get("confirmed") and wallet_name:
            try:
                tx = wallet_module.get_transaction(wallet_name, cur)
                bh = tx.get("blockhash")
                conf = int(tx.get("confirmations", 0) or 0)
                if bh and conf > 0:
                    state["confirmed"] = True
                    state["block_hash"] = bh
                    state["status"] = "confirmed"
            except Exception as e:
                print("[/status confirm-check] erro:", e)

    except Exception as e:
        print("[/status] erro:", e)

    return jsonify(state)


app.register_blueprint(api)

if __name__ == "__main__":
    start_zmq_listeners()
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)
