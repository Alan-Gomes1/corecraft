import {
  Activity,
  Box,
  CheckCircle2,
  Copy,
  Search,
  Send,
  Server,
  TrendingUp,
} from "lucide-react";
import "./App.css";
import Header from "./components/Header";
import { useState } from "react";
import { Card } from "./components/Card/index";
import { type Item } from "./components/Card/CardDetail";

interface ToastItem {
  id: number;
  message: string;
}

function App() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "block" | "tx">("all");
  const log = {
    type: "hashblock",
    hash: "00000003ca0000012",
    origin: "ZMQ Stream",
    time: "14/07/2026 18:14:18",
    confirmed: "Sim",
  };
  const filteredLogs = [log, log, log, log, log];
  const rpcTitle = "ESTADO (RPC)";
  const rpcValue = "307.421";
  const rpcIcon = <Server size={18} />;
  const rpcHelper = 'RPC responde "qual o estado agora?". Confirmação ativa.';
  const rpcData: Item[] = [
    {
      label: "Rede",
      value: "signet",
    },
    {
      label: "Mempool Size",
      value: 52,
    },
    {
      label: "Best Block Hash",
      value: "000003ca000",
    },
  ];

  const zmqTitle = "FLUXO (ZMQ)";
  const zmqValue = "4.020";
  const zmqIcon = <Activity size={18} />;
  const zmqHelper =
    'ZMQ avisa "algo aconteceu". Não é fonte de confirmação final.';
  const zmqData: Item[] = [
    {
      label: "Último Bloco",
      value: "00000003ca00000",
    },
    {
      label: "Eventos de Bloco",
      value: 4.02,
    },
    {
      label: "Eventos de Tx",
      value: "857.539",
    },
  ];

  const networkTitle = "ATIVIDADE DE REDE";
  const networkValue = "0.32 tx/s";
  const networkIcon = <TrendingUp size={18} />;
  const networkHelper = "Taxa calculada sobre a janela de eventos recentes.";
  const networkData: Item[] = [
    {
      label: "Blocos Vistos",
      value: "4.020",
    },
    {
      label: "Txs Observadas",
      value: 857.539,
    },
    {
      label: "Último Evento",
      value: "18/06/2026 18:14:18",
    },
  ];
  const currentBestHash = "000000003ca5486g74r006191Dgdof156";
  const comparisonHelper =
    "Confronta a melhor cadeia conhecida via RPC com a notificada por ZMQ.";

  const showToast = (message: string) => {
    console.log(toasts);
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const handleCopyText = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast(`${description} copiado para a área de transferência!`);
      })
      .catch((err) => {
        console.error("Erro ao copiar texto: ", err);
      });
  };

  return (
    <>
      <main className="main-content">
        <Header />
        <div className="dashboard-grid">
          <Card.Root
            title={rpcTitle}
            icon={rpcIcon}
            value={rpcValue}
            helper={rpcHelper}
          >
            <Card.Detail value={rpcData} />
          </Card.Root>
          <Card.Root
            title={zmqTitle}
            icon={zmqIcon}
            value={zmqValue}
            helper={zmqHelper}
          >
            <Card.Detail value={zmqData} />
          </Card.Root>
          <Card.Root
            title={networkTitle}
            icon={networkIcon}
            value={networkValue}
            helper={networkHelper}
          >
            <Card.Detail value={networkData} />
          </Card.Root>
          <Card.Root
            title="Comparação RPC vs ZMQ"
            icon={<CheckCircle2 size={18} />}
            iconWrapStyle={{
              color: "var(--success)",
              background: "var(--success-glow)",
            }}
            cardValueStyle={{
              fontSize: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: ".8rem",
            }}
            value={
              <>
                Divergência:{" "}
                <span style={{ color: "var(--success)" }}>Não</span>
              </>
            }
            helper={comparisonHelper}
          >
            <Card.Compare
              currentBestHash={currentBestHash}
              handleCopyText={handleCopyText}
            />
          </Card.Root>
        </div>

        <div className="card span-4 logs-card">
          <div className="logs-header">
            <div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: ".4rem" }}>
                Log de Eventos Recentes
              </h3>
              <p style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
                Eventos de transações e blocos notificados em tempo real
              </p>
            </div>
            <div className="logs-controls">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Buscar por hash..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filterType === "all" && "active"}`}
                  onClick={() => setFilterType("all")}
                >
                  Todos
                </button>
                <button
                  className={`filter-tab ${filterType === "block" && "active"}`}
                  onClick={() => setFilterType("block")}
                >
                  Blocos
                </button>
                <button
                  className={`filter-tab ${filterType === "tx" && "active"}`}
                  onClick={() => setFilterType("tx")}
                >
                  Transações
                </button>
              </div>
            </div>
          </div>
          <div className="table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Eventos</th>
                  <th>Origem</th>
                  <th>Hash / ID do Evento</th>
                  <th>Data/Hora</th>
                  <th>Confirmado</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const isBlock = log.type === "hashblock";
                  const badgeClass = isBlock
                    ? "badge-hashblock"
                    : "badge-hashtx";
                  const labelText = isBlock ? "Bloco" : "Transação";
                  const displayHash = `${log.hash.slice(0, 16)}...${log.hash.slice(-16)}`;

                  return (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {isBlock ? <Box size={12} /> : <Send size={12} />}
                          {labelText}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", fontWeight: 500 }}>
                        {log.origin}
                      </td>
                      <td>
                        <div className="hash-cell">
                          <span className="hash-cell-text" title={log.hash}>
                            {displayHash}
                          </span>
                        </div>
                      </td>
                      <td className="time-cell">{log.time}</td>
                      <td>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: ".6rem",
                            color: isBlock ? "var(--success)" : "var(--muted)",
                            fontWeight: 600,
                          }}
                        >
                          <span
                            style={{
                              width: ".6rem",
                              height: ".6rem",
                              borderRadius: "50%",
                              backgroundColor: isBlock
                                ? "var(--success)"
                                : "var(--muted)",
                            }}
                          ></span>
                          {log.confirmed}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="action-btn"
                          style={{
                            width: "3.2rem",
                            height: "3.2rem",
                            display: "inline-flex",
                            borderRadius: ".6rem",
                          }}
                          onClick={() => handleCopyText(log.hash, labelText)}
                          title="Copiar Hash"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
