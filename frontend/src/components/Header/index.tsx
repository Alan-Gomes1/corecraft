import { Moon, RotateCw, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type React from "react";
import { rpcService } from "../../services/rpc";
import type { ZMQStatus } from "../../types";

type HeaderProps = {
  theme: "dark" | "light";
  setTheme: React.Dispatch<React.SetStateAction<"dark" | "light">>;
};

export default function Header({ theme, setTheme }: HeaderProps) {
  const [zmqAge, setZmqAge] = useState<number>(0);
  const isSpinning = false;

  useEffect(() => {
    let isMounted = true;
    rpcService
      .getRpcInfo<ZMQStatus>("/health")
      .then((data) => {
        if (isMounted) {
          setZmqAge(data.zmq_last_event_age_s);
        }
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

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
          <button
            className="action-btn theme-toggle-btn"
            title="Alternar Tema"
            onClick={() =>
              setTheme((prev) => (prev === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>
    </header>
  );
}
