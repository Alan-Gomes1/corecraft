import React, { useState } from "react";

type CardChartProps = {
  chartRef: React.RefObject<HTMLCanvasElement | null>;
};

export default function CardChart({ chartRef }: CardChartProps) {
  const [chartRange, setChartRange] = useState<"realtime" | "1h" | "24h">(
    "realtime",
  );

  return (
    <div className="card span-3 chart-card">
      <div className="chart-header">
        <div>
          <h3 style={{ fontSize: "1.4rem", marginBottom: ".4rem" }}>
            Fluxo e Taxa de Transações
          </h3>
          <p style={{ fontSize: "1.2rem", color: "var(--muted)" }}>
            Frequência de novos hashes e transações chegando via ZMQ
          </p>
        </div>
        <div className="chart-actions">
          <button
            className={`chart-tab ${chartRange === "realtime" ? "active" : ""}`}
            onClick={() => setChartRange("realtime")}
          >
            Tempo Real
          </button>
          <button
            className={`chart-tab ${chartRange === "1h" ? "active" : ""}`}
            onClick={() => setChartRange("1h")}
          >
            Última Hora
          </button>
          <button
            className={`chart-tab ${chartRange === "24h" ? "active" : ""}`}
            onClick={() => setChartRange("24h")}
          >
            24 Horas
          </button>
        </div>
      </div>
      <div className="chart-container">
        <canvas ref={chartRef} id="live-activity-chart"></canvas>
      </div>
    </div>
  );
}
