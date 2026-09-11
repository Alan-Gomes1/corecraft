import { useEffect, useState } from "react";
import { Info, Zap } from "lucide-react";
import { rpcService } from "../../services/rpc";
import type { NodeInfo, ZMQStatus } from "../../types";

export default function CardStatistic() {
  const [rpcTime, setRpcTime] = useState<string>("—");
  const [zmqAge, setZmqAge] = useState<string>("—");
  const [mempoolUsage, setMempoolUsage] = useState<string>("—");
  const [connections, setConnections] = useState<string>("—");
  const [nodeStatusText, setNodeStatusText] = useState<string>(
    "Carregando estatísticas do nó...",
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      try {
        const start = performance.now();
        const nodeInfo = await rpcService.getRpcInfo<NodeInfo>("/node");
        const end = performance.now();

        const health = await rpcService.getRpcInfo<ZMQStatus>("/health");

        if (isMounted) {
          const latency = Math.round(end - start);
          setRpcTime(`${latency}ms`);

          if (
            health.zmq_last_event_age_s !== null &&
            health.zmq_last_event_age_s !== undefined
          ) {
            setZmqAge(`${health.zmq_last_event_age_s}s`);
          } else {
            setZmqAge("N/A");
          }

          if (nodeInfo.mempool) {
            const kb = (nodeInfo.mempool.bytes / 1024).toFixed(1);
            setMempoolUsage(`${kb} KB`);
          }

          if (nodeInfo.network) {
            setConnections(`${nodeInfo.network.connections} peers`);
          }

          const isSynced = nodeInfo.blocks === nodeInfo.headers;
          if (isSynced) {
            setNodeStatusText(
              `Nó Bitcoin Core operando 100% sincronizado com a ${nodeInfo.chain || "Signet"}. Fluxo de ZMQ ativo.`,
            );
          } else {
            const lag = (nodeInfo.headers || 0) - (nodeInfo.blocks || 0);
            setNodeStatusText(
              `Nó Bitcoin Core sincronizando. Restam ${lag} blocos para a sincronização completa.`,
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Erro ao carregar estatísticas do nó:", error);
          setNodeStatusText("Erro ao conectar com as estatísticas do nó.");
        }
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="card span-1">
      <div>
        <div className="card-header-row" style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.4rem" }}>Estatísticas Básicas</h3>
          <Info
            style={{
              color: "var(--muted)",
              width: "2rem",
              height: "2rem",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.6rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
              Tempo RPC
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {rpcTime}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
              Atraso ZMQ
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
                color: "var(--success)",
              }}
            >
              {zmqAge}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
              Uso de Mempool
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {mempoolUsage}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
              Conexões de Entrada
            </span>
            <span
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {connections}
            </span>
          </div>
        </div>
        <div
          style={{
            marginTop: "3rem",
            background: "var(--accent-glow)",
            padding: "1.6rem",
            borderRadius: "1.2rem",
            border: ".1rem dashed var(--accent)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: ".8rem",
              color: "var(--accent)",
            }}
          >
            <Zap size={18} />
            <h4 style={{ fontSize: "1.2rem", fontWeight: 600 }}>
              Status do Nó
            </h4>
          </div>
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.4,
              color: "var(--fg)",
            }}
          >
            {nodeStatusText}
          </p>
        </div>
      </div>
    </div>
  );
}
