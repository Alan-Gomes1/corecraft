import { Activity, CheckCircle2, Copy, Server, TrendingUp } from "lucide-react";
import "./App.css";
import Header from "./components/Header";
import Card from "./components/Card";
import { useState } from "react";
import CardItem from "./components/CardItem";

interface ToastItem {
  id: number;
  message: string;
}

function App() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const rpcTitle = "ESTADO (RPC)";
  const rpcValue = "307.421";
  const rpcIcon = <Server size={18} />;
  const rpcHelper = 'RPC responde "qual o estado agora?". Confirmação ativa.';
  const rpcData = [
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
  const zmqData = [
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
  const networkData = [
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
          <Card
            title={rpcTitle}
            icon={rpcIcon}
            value={rpcValue}
            helper={rpcHelper}
          >
            <div className="card-details">
              {rpcData.map((item) => (
                <CardItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </Card>
          <Card
            title={zmqTitle}
            icon={zmqIcon}
            value={zmqValue}
            helper={zmqHelper}
          >
            <div className="card-details">
              {zmqData.map((item) => (
                <CardItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </Card>
          <Card
            title={networkTitle}
            icon={networkIcon}
            value={networkValue}
            helper={networkHelper}
          >
            <div className="card-details">
              {networkData.map((item) => (
                <CardItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </Card>
          <Card
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
            <div className="compare-box" style={{ marginTop: "1.6rem" }}>
              <div className="compare-header">
                <span>RPC Best Block Hash</span>
              </div>
              <div className="compare-value">
                <span>{currentBestHash}</span>
                <button
                  className="copy-btn"
                  onClick={() =>
                    handleCopyText(currentBestHash, "PRC Best Block Hash")
                  }
                  title="Copiar Hash"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
            <div className="compare-box">
              <div className="compare-header">
                <span>ZMQ Last See Block</span>
              </div>
              <div className="compare-value">
                <span>{currentBestHash}</span>
                <button
                  className="copy-btn"
                  onClick={() =>
                    handleCopyText(currentBestHash, "ZMQ Last See Block Hash")
                  }
                  title="Copiar Hash"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}

export default App;
