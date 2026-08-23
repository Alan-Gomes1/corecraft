import { Box, Copy, Send } from "lucide-react";
import type { LogItem } from "../../types/rpc";
import LogsTableBodyEmpty from "./LogsTableBodyEmpty";

type LogsTableBodyProps = {
  logs: LogItem[];
  onCopy: (text: string, description: string) => void;
};

export default function LogsTableBody({ logs, onCopy }: LogsTableBodyProps) {
  if (logs.length === 0) {
    return <LogsTableBodyEmpty />;
  }

  return (
    <tbody>
      {logs.map((log) => {
        const isBlock = log.type === "block";
        const badgeClass = isBlock ? "badge-hashblock" : "badge-hashtx";
        const labelText = isBlock ? "Bloco" : "Transação";
        const logHash = log.hash;
        const displayHash =
          logHash.length > 32
            ? `${logHash.slice(0, 16)}...${logHash.slice(-16)}`
            : logHash;
        const formattedTime = log.ts
          ? new Date(log.ts * 1000).toLocaleString("pt-BR")
          : "-";

        return (
          <tr key={log.id}>
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
                <span className="hash-cell-text" title={logHash}>
                  {displayHash}
                </span>
              </div>
            </td>
            <td className="time-cell">{formattedTime}</td>
            <td>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".6rem",
                  color: log.confirmed ? "var(--success)" : "var(--muted)",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: ".6rem",
                    height: ".6rem",
                    borderRadius: "50%",
                    backgroundColor: log.confirmed
                      ? "var(--success)"
                      : "var(--muted)",
                  }}
                ></span>
                {log.confirmed ? "Sim" : "Não"}
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
                onClick={() => onCopy(logHash, labelText)}
                title="Copiar Hash"
              >
                <Copy size={14} />
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
