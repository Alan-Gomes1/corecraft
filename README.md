# CoreCraft — Tarefas Práticas

Resolução das tarefas práticas do programa **CoreCraft** da comunidade Bitcoin Coders. Cada atividade aprofunda um conceito de integração com o protocolo Bitcoin, construindo progressivamente desde uma leitura simples via RPC até o gerenciamento de wallets e acompanhamento do ciclo de vida de transações.

---

## Estrutura do repositório

```
corecraft/
├── atividade-1/          # Aula 1 — RPC como fotografia do estado
├── atividade-2/          # Aula 2 — ZMQ como fluxo de eventos
├── atividade-3/          # Aula 3 — Multi-wallet e ciclo de vida de transações
└── docker-compose.yml    # Orquestração das atividades 2 e 3 + nginx
```

---

## Atividades

### Aula 1 — RPC como fotografia do estado

Integração com o node Bitcoin via JSON-RPC puro. Um backend Flask expõe dados da blockchain em uma API REST, e o frontend exibe uma "fotografia" do estado atual: altura do bloco, melhor hash, tamanho da mempool e informações do node.

**Conceito central:** RPC é síncrono e pontual — cada chamada retorna o estado no momento da requisição.

→ [`atividade-1/README.md`](atividade-1/README.md)

---

### Aula 2 — ZMQ como fluxo de eventos

Adição do ZeroMQ como canal de streaming. O backend mantém filas em memória atualizadas por threads em segundo plano que escutam `hashblock` e `hashtx` do `bitcoind`. O frontend polling consome essa fila e exibe a diferença entre o modelo RPC (estado) e o modelo ZMQ (eventos).

**Conceito central:** ZMQ notifica que "algo aconteceu", mas não é confirmação — o RPC ainda é a fonte de verdade.

→ [`atividade-2/README.md`](atividade-2/README.md)

---

### Aula 3 — Multi-wallet e ciclo de vida de transações

Gerenciamento de múltiplas wallets do Bitcoin Core e construção manual de transações. O usuário seleciona uma wallet, consulta UTXOs, envia uma transação e acompanha seu ciclo de vida em tempo real: `broadcast` → `mempool` → `confirmed`.

**Conceito central:** uma transação passa por estados distintos — broadcast ao node, aceitação na mempool e inclusão em bloco — cada um com semântica e garantias diferentes.

→ [`atividade-3/README.md`](atividade-3/README.md)

---

## Arquitetura geral (deploy)

```
Internet
    │
    ▼
nginx (porta 3000)
    │
    ├── /           → proxy → corecraft-a2 (porta 8000)   [Atividade 2]
    └── /a3/        → proxy → corecraft-a3 (porta 5000)   [Atividade 3]

corecraft-a2        Flask + ZMQ listener
corecraft-a3        Flask + ZMQ listener + wallet manager
    │
    └── JSON-RPC + ZMQ ──▶ bitcoind (signet, host)
```

```
![Arquitetura CoreCraft](/docs/architecture/corecraft-architecture.svg)
```

Todas as atividades a partir da 2 são containerizadas via Docker Compose e acessam o `bitcoind` rodando no host via `host.docker.internal` (ou o IP da bridge Docker configurado no `.env`).

---

## Deploy rápido (Atividades 2 e 3)

```bash
# 1. Copie o arquivo de exemplo e ajuste as variáveis
cp .env.example .env

# 2. Suba os serviços
docker compose up -d

# 3. Acesse
#   Atividade 2: http://<host>:3000/
#   Atividade 3: http://<host>:3000/a3/
```

---

## Variáveis de ambiente (`.env`)

| Variável              | Descrição                                 |
| --------------------- | ----------------------------------------- |
| `A2_BITCOIN_RPC_URL`  | URL RPC para a atividade 2                |
| `A2_BITCOIN_RPC_USER` | Usuário RPC                               |
| `A2_BITCOIN_RPC_PASS` | Senha RPC                                 |
| `A2_ZMQ_HASHBLOCK`    | Endpoint ZMQ hashblock para a atividade 2 |
| `A2_ZMQ_HASHTX`       | Endpoint ZMQ hashtx para a atividade 2    |
| `A3_BITCOIN_RPC_URL`  | URL RPC para a atividade 3                |
| `A3_BITCOIN_RPC_USER` | Usuário RPC                               |
| `A3_BITCOIN_RPC_PASS` | Senha RPC                                 |
| `A3_ZMQ_HASHTX`       | Endpoint ZMQ hashtx para a atividade 3    |
| `A3_ZMQ_HASHBLOCK`    | Endpoint ZMQ hashblock para a atividade 3 |

---

## Pré-requisitos

- Docker + Docker Compose
- Node Bitcoin (`bitcoind`) rodando na rede **signet** com RPC e ZMQ habilitados
- Python 3.12+ (para execução local sem Docker)

### Configuração mínima do `bitcoin.conf`

```ini
signet=1
daemon=1
txindex=1

[signet]
rpcuser=teste
rpcpassword=teste
rpcbind=0.0.0.0
rpcport=38332
rpcallowip=0.0.0.0/0

zmqpubhashblock=tcp://0.0.0.0:18123
zmqpubhashtx=tcp://0.0.0.0:18123
```

---

## Sobre o CoreCraft

O **CoreCraft** é um programa de mentoria técnica da comunidade Bitcoin Coders focado em desenvolvimento de aplicações sobre o protocolo Bitcoin. As atividades exploram a integração direta com o `bitcoind` usando ferramentas de produção: JSON-RPC, ZMQ, gerenciamento de wallets e construção manual de transações.
