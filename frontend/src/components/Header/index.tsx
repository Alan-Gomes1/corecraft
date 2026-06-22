import { Moon, RotateCw, Sun } from "lucide-react";

export default function Header() {
  const zmqAge = 7.45;
  const theme = "dark";
  const isSpinning = false;

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h2>Painel de Atividade do Nó</h2>
      </div>
      <div className="top-bar-right">
        <div className="status-pill">
          <span>RPC ok • ZMQ age: {zmqAge}s</span>
        </div>
        <div className="top-bar-btns">
          <button
            className={`action-btn refresh-btn ${isSpinning ? "spinning" : ""}`}
            title="Atualizar Dados"
          >
            <RotateCw />
          </button>
          <button className="action-btn theme-toggle-btn" title="Alternar Tema">
            {theme === "dark" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>
    </header>
  );
}
