export default function LogsTableHead() {
  return (
    <thead>
      <tr>
        <th>Eventos</th>
        <th>Origem</th>
        <th>Hash / ID do Evento</th>
        <th>Data/Hora</th>
        <th>Confirmado</th>
        <th style={{ textAlign: "right" }}>Ações</th>
      </tr>
    </thead>
  );
}
