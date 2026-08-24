import type React from "react";

type LogsTableRootProps = {
  children: React.ReactNode;
};

export default function LogsTableRoot({ children }: LogsTableRootProps) {
  return (
    <div className="table-container">
      <table className="logs-table">{children}</table>
    </div>
  );
}
