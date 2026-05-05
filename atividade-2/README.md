# Atividade 2 — ZMQ como fluxo de eventos

> **CoreCraft** · Mentoria Aula 2

Implementação da tarefa prática da segunda aula do curso CoreCraft. O objetivo é expandir a integração com o node Bitcoin adicionando **ZMQ (ZeroMQ)** como canal de eventos em tempo real, contrastando o modelo de leitura pontual (RPC) com o modelo de streaming de eventos (ZMQ).

---

## Proposta da atividade

A tarefa consiste em criar um backend que escuta notificações ZMQ do `bitcoind` (novos blocos e novas transações na mempool) e expõe esse estado acumulado via API REST. O frontend consome periodicamente essa API para exibir o fluxo de eventos — sem conectar diretamente ao ZMQ.

O ponto central do aprendizado é entender a diferença entre:

- **RPC** → fotografia do estado atual ("qual é o melhor bloco agora?")
- **ZMQ** → fluxo de eventos ("um novo bloco foi visto")
- **Divergência** → os dois podem discordar por latência, reorg ou timing de polling

---

## Arquitetura

```
Frontend (HTML/JS)
      │
      │  HTTP polling (fetch a cada 1,5 s)
      ▼
Backend Flask (Python)
      │  ├─ /api/health              → checa RPC + age do último evento ZMQ
      │  ├─ /api/state               → foto RPC + fila ZMQ em RAM
      │  ├─ /api/events/summary      → contadores e taxa de tx/s
      │  ├─ /api/events/latest       → últimos hashes de blocos e txs
      │  └─ /api/events/state-comparison → divergência RPC vs ZMQ
      │
      ├─── JSON-RPC (HTTP Basic Auth)
      │         └▶ bitcoind
      │
      └─── ZMQ SUB (tcp)
                └▶ bitcoind (hashblock + hashtx)
```

---

## Estrutura do projeto

```
atividade-2/
├── backend/
│   ├── app.py            # Flask + threads ZMQ + endpoints da API
│   └── requirements.txt  # Dependências Python
└── frontend/
    ├── index.html        # Painel de visualização
    ├── app.js            # Lógica de fetch e renderização
    └── styles.css        # Estilos
```

---

## Endpoints da API

| Método | Rota                           | Descrição                                                       |
| ------ | ------------------------------ | --------------------------------------------------------------- |
| GET    | `/api/health`                  | Status do RPC e idade do último evento ZMQ recebido             |
| GET    | `/api/state`                   | Foto RPC (chain, height, mempool) + fila de eventos ZMQ em RAM  |
| GET    | `/api/events/summary`          | Contadores totais e taxa de transações por segundo (janela RAM) |
| GET    | `/api/events/latest`           | Últimos hashes de blocos (`hash`) e transações (`txid`) vistos  |
| GET    | `/api/events/state-comparison` | Compara `bestblockhash` do RPC com o último bloco visto via ZMQ |

---

## Variáveis de ambiente

| Variável           | Padrão                   | Descrição                                         |
| ------------------ | ------------------------ | ------------------------------------------------- |
| `BITCOIN_RPC_URL`  | `http://127.0.0.1:38332` | URL do endpoint JSON-RPC do bitcoind              |
| `BITCOIN_RPC_USER` | `teste`                  | Usuário RPC                                       |
| `BITCOIN_RPC_PASS` | `teste`                  | Senha RPC                                         |
| `ZMQ_HASHBLOCK`    | `tcp://127.0.0.1:18123`  | Endpoint ZMQ para notificações de novos blocos    |
| `ZMQ_HASHTX`       | `tcp://127.0.0.1:18123`  | Endpoint ZMQ para notificações de novas txs       |
| `MAX_BLOCK_EVENTS` | `25`                     | Tamanho máximo da fila de eventos de bloco em RAM |
| `MAX_TX_EVENTS`    | `60`                     | Tamanho máximo da fila de eventos de tx em RAM    |
| `PORT`             | `8000`                   | Porta em que o Flask sobe                         |

---

## Pré-requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (gerenciador de pacotes) **ou** `pip`
- Node Bitcoin (`bitcoind`) com ZMQ habilitado no `bitcoin.conf`:

```ini
zmqpubhashblock=tcp://127.0.0.1:18123
zmqpubhashtx=tcp://127.0.0.1:18123
```

---

## Como executar

```bash
cd atividade-2/backend
pip install -r requirements.txt
python app.py
```

Para rodar apontando para um node na **signet** com credenciais customizadas:

```bash
export BITCOIN_RPC_URL=http://127.0.0.1:38332
export BITCOIN_RPC_USER=meu_usuario
export BITCOIN_RPC_PASS=minha_senha
export ZMQ_HASHBLOCK=tcp://127.0.0.1:28332
export ZMQ_HASHTX=tcp://127.0.0.1:28333
python app.py
```

O Flask sobe em `http://127.0.0.1:8000` e já serve o frontend automaticamente na raiz `/`.

---

## Conceitos abordados

- **ZMQ SUB socket** — como o `bitcoind` notifica eventos sem que o cliente precise fazer polling no node
- **Threads em background** — duas threads independentes escutam `hashblock` e `hashtx` simultaneamente
- **Estado em RAM com deque** — fila circular com limite configurável, protegida por `threading.Lock`
- **RPC como fonte de verdade** — eventos ZMQ são avisos, não confirmações; o RPC confirma o estado final
- **Divergência RPC vs ZMQ** — quando `bestblockhash` (RPC) difere do último `hashblock` (ZMQ): reorg, latência ou timing de polling
- **Taxa de eventos** — cálculo de `tx/s` sobre a janela de eventos mantida em memória
