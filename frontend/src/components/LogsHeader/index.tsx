import { Search } from "lucide-react";
import type React from "react";
import type { FilterType } from "../../types/rpc";

type LogsHeaderProps = {
  searchQuery: string;
  filterType: "all" | "block" | "tx";
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setFilterType: React.Dispatch<React.SetStateAction<FilterType>>;
};

export default function LogsHeader({
  searchQuery,
  filterType,
  setSearchQuery,
  setFilterType,
}: LogsHeaderProps) {
  return (
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
  );
}
