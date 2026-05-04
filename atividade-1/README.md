# Atividade 1 — RPC como fotografia do estado

> **CoreCraft** · Mentoria Aula 1

Implementação da tarefa prática da primeira aula do curso CoreCraft. O objetivo é construir uma integração real com um node Bitcoin via JSON-RPC, expondo os dados em uma API REST com Flask e visualizando-os em um painel HTML simples.

---

## Proposta da atividade

A tarefa consiste em criar uma camada de comunicação entre um node Bitcoin (bitcoind) e um frontend local, utilizando o protocolo JSON-RPC como única fonte de dados. Não há WebSocket nem ZMQ — cada atualização é uma "fotografia" do estado atual da blockchain no momento da requisição.

---

## Arquitetura

```
Frontend (HTML/JS)
      │
      │  HTTP (fetch)
      ▼
Backend Flask (Python)
      │
      │  JSON-RPC (HTTP Basic Auth / cookie)
      ▼
bitcoind (node local)
```

---

## Estrutura do projeto

```
atividade-1/
├── backend/
│   ├── app.py            # Rotas Flask (endpoints da API)
│   ├── rpc.py            # Cliente JSON-RPC minimalista
│   ├── utils.py          # Helpers: ok(), fail(), cálculos de fee
│   ├── internal_types.py # TypedDicts: MempoolInfo, RawMempool
│   └── pyproject.toml    # Dependências e configuração de tooling
└── frontend/
    ├── index.html        # Painel de visualização
    ├── app.js            # Lógica de fetch e renderização
    └── styles.css        # Estilos
```

---

## Endpoints da API

| Método | Rota                     | Descrição                                                     |
| ------ | ------------------------ | ------------------------------------------------------------- |
| GET    | `/api/node`              | Snapshot do node: blockchain, mempool e rede                  |
| GET    | `/api/blocks/recent`     | Lista os N blocos mais recentes com estatísticas de fee       |
| GET    | `/api/block/<blockhash>` | Resumo de um bloco por hash                                   |
| GET    | `/api/tx/<txid>`         | Detalhes de uma transação (requer `txindex=1` ou mempool)     |
| GET    | `/api/mempool/summary`   | Resumo da mempool com distribuição de taxas (low/medium/high) |
| GET    | `/api/blockchain/lag`    | Avalia o estado de sincronização do node                      |

Todos os endpoints retornam JSON no formato:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": { "message": "...", "details": "..." } }
```

---

## Pré-requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (gerenciador de pacotes)
- Node Bitcoin (`bitcoind`) acessível localmente

---

## Configuração

A autenticação RPC é resolvida automaticamente:

1. **Cookie auth** (padrão local): o cliente lê `~/.bitcoin/.cookie` automaticamente.
2. **Usuário/senha**: defina as variáveis de ambiente abaixo.

| Variável      | Padrão       | Descrição                                    |
| ------------- | ------------ | -------------------------------------------- |
| `RPC_HOST`    | `127.0.0.1`  | Host do bitcoind                             |
| `RPC_PORT`    | `18113`      | Porta RPC                                    |
| `RPC_USER`    | —            | Usuário RPC (opcional se usar cookie)        |
| `RPC_PASS`    | —            | Senha RPC (opcional se usar cookie)          |
| `RPC_WALLET`  | —            | Nome da wallet (opcional)                    |
| `BTC_NETWORK` | `main`       | Rede: `main`, `testnet`, `regtest`, `signet` |
| `BTC_DATADIR` | `~/.bitcoin` | Diretório de dados do bitcoind               |

---

## Como executar

```bash
cd atividade-1/backend
uv run app.py
```

Para rodar apontando para um node na **signet**:

```bash
export BTC_NETWORK=signet
export RPC_PORT=38332
uv run app.py
```

O Flask sobe em `http://127.0.0.1:8080` e já serve o frontend automaticamente na raiz `/`.

---

## Conceitos abordados

- **JSON-RPC sobre HTTP** com autenticação Basic (cookie ou usuário/senha)
- **RPC como leitura pontual** — sem estado, sem streaming
- `getblockchaininfo`, `getmempoolinfo`, `getnetworkinfo`, `getblockstats`
- `getrawtransaction` e sua dependência de `txindex=1`
- Cálculo de fee rate em **satoshis por vbyte** (sats/vB)
- Classificação de transações por prioridade de fee (low / medium / high)
- Avaliação de **lag de sincronização** (headers − blocks)
