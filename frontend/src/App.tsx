import { Activity, CheckCircle2, Server, TrendingUp } from "lucide-react";
import "./App.css";
import Header from "./components/Header";
import { useState } from "react";
import { Card } from "./components/Card/index";
import { type Item } from "./components/Card/CardDetail";
import { useNodeInfo } from "./hooks/useNodeInfo";
import Footer from "./components/Footer";
import useLatestEvents from "./hooks/useLatestEvents";
import type { FilterType } from "./types/rpc";
import { LogsTable } from "./components/LogsTable";
import LogsHeader from "./components/LogsHeader";
import { useLogs } from "./hooks/useLogs";

interface ToastItem {
  id: number;
  message: string;
}

function App() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const { rpcData, rpcValue, currentBestHash } = useNodeInfo();
  const rawEvents = useLatestEvents();
  const logs = useLogs(rawEvents, filterType, searchQuery);
  const rpcTitle = "ESTADO (RPC)";
  const rpcIcon = <Server size={18} />;
  const rpcHelper = 'RPC responde "qual o estado agora?". Confirmação ativa.';

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
          <LogsHeader
            searchQuery={searchQuery}
            filterType={filterType}
            setSearchQuery={setSearchQuery}
            setFilterType={setFilterType}
          />
          <LogsTable.Root>
            <LogsTable.Head />
            <LogsTable.Body logs={logs} onCopy={handleCopyText} />
          </LogsTable.Root>
        </div>

        <Footer />
      </main>
    </>
  );
}

export default App;
