import { Activity, Server, TrendingUp } from "lucide-react";
import "./App.css";
import Header from "./components/Header";
import Card from "./components/Card";

function App() {
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

  return (
    <>
      <main className="main-content">
        <Header />
        <div className="dashboard-grid">
          <Card
            title={rpcTitle}
            icon={rpcIcon}
            value={rpcValue}
            data={rpcData}
            helper={rpcHelper}
          />
          <Card
            title={zmqTitle}
            icon={zmqIcon}
            value={zmqValue}
            data={zmqData}
            helper={zmqHelper}
          />
          <Card
            title={networkTitle}
            icon={networkIcon}
            value={networkValue}
            data={networkData}
            helper={networkHelper}
          />
        </div>
      </main>
    </>
  );
}

export default App;
