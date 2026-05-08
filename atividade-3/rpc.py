# rpc.py

import requests
import json

class BitcoinRPC:
    def __init__(self, url, user, password):
        self.url = url
        self.auth = (user, password)

    def call(self, method, params=[], wallet=None):
        url = self.url
        if wallet:
            url = f"{url}/wallet/{wallet}"

        payload = {
            "jsonrpc": "1.0",
            "id": "corecraft",
            "method": method,
            "params": params
        }

        response = requests.post(
            url,
            auth=self.auth,
            data=json.dumps(payload)
        )

        result = response.json()
        if result.get("error"):
            raise Exception(result["error"])

        return result["result"]

    def wallet_call(self, wallet_name: str, method: str, params=[]):
        """
        Chama um método RPC no contexto de uma wallet específica.
        Usa o endpoint /wallet/<wallet_name> do Bitcoin Core.
        """
        base = self.url.rstrip("/")
        wallet_url = f"{base}/wallet/{wallet_name}"
        payload = {
            "jsonrpc": "1.0",
            "id": "corecraft",
            "method": method,
            "params": params
        }
        response = requests.post(
            wallet_url,
            auth=self.auth,
            data=json.dumps(payload)
        )
        result = response.json()
        if result.get("error"):
            raise Exception(result["error"])
        return result["result"]
