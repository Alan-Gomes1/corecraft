# Atividade 3 — Multi-wallet e ciclo de vida de transações

> **CoreCraft** · Mentoria Aula 3

Implementação da tarefa prática da terceira aula do curso CoreCraft. O objetivo é expandir o monitor de transações adicionando **suporte a múltiplas wallets** do Bitcoin Core e **interpretação semântica do ciclo de vida** de cada transação enviada: desde o broadcast até a confirmação em bloco.

---

## Proposta da atividade

A tarefa consiste em:

1. Listar e carregar wallets disponíveis no node via RPC (`listwalletdir`, `loadwallet`)
2. Selecionar uma wallet ativa e consultar seu saldo e UTXOs
3. Construir, assinar e transmitir transações usando a wallet selecionada
4. Acompanhar a transação em tempo real via ZMQ (mempool → confirmação)
5. Interpretar semanticamente o estado (`broadcast` → `mempool` → `confirmed`)

---

## Arquitetura

```
Frontend (HTML/JS)
      │
      │  HTTP polling (fetch a cada 2 s)
      ▼
Backend Flask (Python)
      │  ├─ GET  /wallets               → lista wallets disponíveis e carregadas
      │  ├─ POST /wallet/select         → carrega e ativa uma wallet
      │  ├─ GET  /wallet/status         → saldo e UTXOs da wallet ativa
      │  ├─ POST /send                  → constrói, assina e faz broadcast da tx
      │  ├─ GET  /tx/<txid>             → interpreta o estado atual da transação
      │  └─ GET  /status                → estado global do monitor (ZMQ + RPC)
      │
      ├─── JSON-RPC (HTTP Basic Auth)
      │    ├─ /               → chamadas globais (listwalletdir, etc.)
      │    └─ /wallet/<name>  → chamadas no contexto de uma wallet específica
      │         └▶ bitcoind
      │
      └─── ZMQ SUB (tcp)
                └▶ bitcoind (hashtx + hashblock)
```

---

## Estrutura do projeto

```
atividade-3/
├── backend.py          # Flask + Blueprint /a3 + endpoints + interpretação de tx
├── wallet.py           # Funções de gerenciamento de wallets (RPC por wallet)
├── tx_builder.py       # Construção manual de transação (UTXO → raw tx → sign → send)
├── rpc.py              # Cliente JSON-RPC com suporte a /wallet/<name>
├── state.py            # Estado global em memória (txid, status, wallet, sent_at)
├── zmq_listener.py     # Threads ZMQ para hashtx e hashblock
├── frontend.html       # Interface completa (wallet selector, envio, histórico)
├── gunicorn.conf.py    # Configuração do Gunicorn (1 worker, ZMQ no post_fork)
├── Dockerfile
└── requirements.txt
```

---

## Endpoints da API

| Método | Rota             | Descrição                                                                   |
| ------ | ---------------- | --------------------------------------------------------------------------- |
| GET    | `/wallets`       | Lista wallets disponíveis em disco e carregadas na memória                  |
| POST   | `/wallet/select` | Carrega e ativa uma wallet (`{ "wallet": "nome" }`)                         |
| GET    | `/wallet/status` | Saldo (BTC) e número de UTXOs da wallet ativa                               |
| POST   | `/send`          | Envia transação (`{ "address": "tb1q...", "amount": "0.0001" }`)            |
| GET    | `/tx/<txid>`     | Interpretação semântica do estado atual da tx (broadcast/mempool/confirmed) |
| GET    | `/status`        | Estado global: txid atual, status ZMQ, wallet, confirmação                  |

> No deploy via Docker + nginx, todos os endpoints são prefixados com `/a3` (ex.: `GET /a3/wallets`).

---

## Ciclo de vida de uma transação

```
[POST /send]
     │
     ▼
broadcast ──→ ZMQ hashtx ──→ mempool ──→ ZMQ hashblock ──→ confirmed
                                │
                                └─ > 120s na mempool → warning de delay
```

---

## Variáveis de ambiente

| Variável           | Padrão                   | Descrição                                      |
| ------------------ | ------------------------ | ---------------------------------------------- |
| `BITCOIN_RPC_URL`  | `http://127.0.0.1:38332` | URL do endpoint JSON-RPC do bitcoind           |
| `BITCOIN_RPC_USER` | `teste`                  | Usuário RPC                                    |
| `BITCOIN_RPC_PASS` | `teste`                  | Senha RPC                                      |
| `ZMQ_HASHTX`       | `tcp://127.0.0.1:58332`  | Endpoint ZMQ para notificações de novas txs    |
| `ZMQ_HASHBLOCK`    | `tcp://127.0.0.1:58335`  | Endpoint ZMQ para notificações de novos blocos |

---

## Pré-requisitos

- Python 3.12+
- `pip` ou `uv`
- Node Bitcoin (`bitcoind`) com ZMQ habilitado no `bitcoin.conf`:

```ini
[signet]
zmqpubhashtx=tcp://127.0.0.1:58332
zmqpubhashblock=tcp://127.0.0.1:58335
rpcport=38332
rpcuser=teste
rpcpassword=teste
```

---

## Como executar

```bash
cd atividade-3
pip install -r requirements.txt
python backend.py
```

Para rodar apontando para um node com credenciais customizadas:

```bash
export BITCOIN_RPC_URL=http://127.0.0.1:38332
export BITCOIN_RPC_USER=meu_usuario
export BITCOIN_RPC_PASS=minha_senha
export ZMQ_HASHTX=tcp://127.0.0.1:58332
export ZMQ_HASHBLOCK=tcp://127.0.0.1:58335
python backend.py
```

O Flask sobe em `http://127.0.0.1:5000` e serve o frontend na raiz `/`.

---

## Conceitos abordados

- **Multi-wallet RPC** — uso do endpoint `/wallet/<name>` para operações no contexto de uma wallet específica
- **Construção manual de tx** — seleção de UTXOs, cálculo de troco, `createrawtransaction` → `signrawtransactionwithwallet` → `sendrawtransaction`
- **Ciclo de vida semântico** — interpretação dos estados `broadcast`, `mempool`, `confirmed` com mensagens legíveis
- **ZMQ como trigger** — `hashtx` confirma entrada na mempool; `hashblock` dispara verificação de confirmação via RPC
- **Estado global em RAM** — `state.py` compartilhado entre threads ZMQ e handlers HTTP
- **Separação de responsabilidades** — `wallet.py` (gerenciamento), `tx_builder.py` (construção), `rpc.py` (transporte), `state.py` (estado)
