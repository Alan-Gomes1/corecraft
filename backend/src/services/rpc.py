import base64
import json
import os
from collections.abc import Sequence
from pathlib import Path
from typing import Any

import niquests
from dotenv import load_dotenv

load_dotenv()


class BitcoinRPCError(Exception):
    pass


class BitcoinRPC:
    """
    Cliente JSON-RPC.
    - Usa RPC_USER/RPC_PASS se existir ou tenta cookie auth.
    """

    def __init__(self):
        self.host = os.getenv("RPC_HOST", "127.0.0.1")
        self.port = int(os.getenv("RPC_PORT", "18113"))
        self.wallet = os.getenv("RPC_WALLET", "").strip()
        self.network = os.getenv("BTC_NETWORK", "signet").strip()

        self.user = os.getenv("RPC_USER")
        self.password = os.getenv("RPC_PASS")

        if not (self.user and self.password):
            self.user, self.password = self._read_cookie()

        self._session = niquests.AsyncSession()
        self._url = self._build_url()

    def _build_url(self) -> str:
        """
        Constrói a URL do endpoint RPC.

        Returns:
            str: URL do endpoint RPC
        """
        if self.wallet:
            return f"http://{self.host}:{self.port}/wallet/{self.wallet}"
        return f"http://{self.host}:{self.port}/"

    def _read_cookie(self) -> tuple[str, str]:
        """
        Descobre caminho padrão do cookie por rede e lê credenciais.

        Raises:
            BitcoinRPCError: Se o cookie não existir ou for inválido.

        Returns:
            tuple: (user, password)
        """
        base = Path(os.getenv("BTC_DATADIR", str(Path.home() / ".bitcoin")))
        net = self.network.lower()

        cookie_paths = {
            "main": base / ".cookie",
            "testnet": base / "testnet3" / ".cookie",
            "regtest": base / "regtest" / ".cookie",
            "signet": base / "signet" / ".cookie",
        }
        cookie_path = cookie_paths.get(net, base / ".cookie")

        if not cookie_path.exists():
            raise BitcoinRPCError(
                f"Cookie RPC não encontrado em {cookie_path}. "
                "Defina RPC_USER/RPC_PASS ou ajuste BTC_NETWORK/BTC_DATADIR."
            )

        content = cookie_path.read_text().strip()
        if ":" not in content:
            raise BitcoinRPCError(f"Cookie inválido em {cookie_path}")

        user, password = content.split(":", 1)
        return user, password

    async def call(
        self,
        method: str,
        params: Sequence[Any] | None = None,
    ) -> Any:
        """
        Realiza uma chamada RPC.

        Args:
            method (str): O método RPC a ser chamado.
            params (list | None): Lista de parâmetros para o método RPC.
            Defaults to None.

        Raises:
            BitcoinRPCError: Se ocorrer um erro de rede, HTTP ou se o RPC
            retornar um erro.

        Returns:
            dict: O resultado da chamada RPC.
        """
        payload = {
            "jsonrpc": "1.0",
            "id": "corecraft",
            "method": method,
            "params": params if params else [],
        }

        auth = f"{self.user}:{self.password}".encode()
        auth_header = base64.b64encode(auth).decode("utf-8")

        try:
            response = await self._session.post(
                self._url,
                data=json.dumps(payload),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {auth_header}",
                },
                timeout=10,
            )
        except niquests.RequestException as ex:
            raise BitcoinRPCError(f"Falha de rede ao chamar RPC: {ex}") from ex
        except Exception as ex:
            raise BitcoinRPCError(
                f"Erro inesperado ao chamar RPC: {ex}"
            ) from ex

        if response.status_code != 200:
            raise BitcoinRPCError(
                f"RPC HTTP {response.status_code}: {response.text[:200]}"
            )

        data = response.json()
        if data.get("error"):
            raise BitcoinRPCError(data["error"])

        return data["result"]
