# tx_builder.py

import os
from decimal import Decimal, ROUND_DOWN

from rpc import BitcoinRPC
from wallet import get_utxos, get_change_address

rpc = BitcoinRPC(
    os.getenv("BITCOIN_RPC_URL",  "http://127.0.0.1:38332"),
    os.getenv("BITCOIN_RPC_USER", "teste"),
    os.getenv("BITCOIN_RPC_PASS", "teste"),
)

SAT = Decimal("0.00000001")


def btc(value) -> Decimal:
    """
    Converte valores para Decimal com 8 casas.
    Evita problemas de float em valores monetários.
    """
    return Decimal(str(value)).quantize(SAT, rounding=ROUND_DOWN)


def build_transaction(to_address: str, amount_btc: float, wallet_name: str) -> str:
    """
    Constrói uma transação raw usando a wallet especificada.
    A lógica é manual no backend:
    - consulta UTXOs da wallet
    - seleciona inputs
    - calcula fee fixa
    - calcula troco
    - monta inputs/outputs como estruturas Python
    - pede ao Bitcoin Core para serializar via createrawtransaction

    A assinatura e o broadcast continuam no backend.py.
    """

    amount = btc(amount_btc)

    # Em produção, a fee deveria ser calculada por sat/vB.
    fee = btc("0.00001")

    target = amount + fee

    utxos = get_utxos(wallet_name)

    if not utxos:
        raise Exception("Nenhum UTXO disponível (listunspent vazio)")

    selected = []
    total_in = btc("0")

    for utxo in utxos:
        selected.append(utxo)
        total_in += btc(utxo["amount"])

        if total_in >= target:
            break

    if total_in < target:
        missing = target - total_in
        raise Exception(
            "Saldo insuficiente para amount+fee: "
            f"total_utxos={total_in:.8f} precisa={target:.8f} "
            f"(amount={amount:.8f} + fee={fee:.8f}) falta={missing:.8f}"
        )

    change = total_in - amount - fee

    inputs = []
    for utxo in selected:
        inputs.append({
            "txid": utxo["txid"],
            "vout": int(utxo["vout"])
        })

    outputs = []

    outputs.append({
        to_address: float(amount)
    })

    # Evita criar troco muito pequeno.
    # Se o troco for menor que 1000 sats, ele é absorvido pela fee.
    dust_like_threshold = btc("0.00001")

    if change >= dust_like_threshold:
        change_address = get_change_address(wallet_name)
        outputs.append({
            change_address: float(change)
        })
    else:
        fee = fee + change
        change = btc("0")

    print("TX build:")
    print(" - wallet:", wallet_name)
    print(" - inputs:", inputs)
    print(" - total_in:", f"{total_in:.8f}")
    print(" - amount:", f"{amount:.8f}")
    print(" - fee:", f"{fee:.8f}")
    print(" - change:", f"{change:.8f}")
    print(" - outputs:", outputs)

    raw_tx = rpc.call("createrawtransaction", [inputs, outputs])

    return raw_tx
