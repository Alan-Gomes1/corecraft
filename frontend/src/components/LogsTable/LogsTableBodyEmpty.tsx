export default function LogsTableBodyEmpty() {
  return (
    <tbody>
      <tr>
        <td
          colSpan={6}
          style={{
            textAlign: "center",
            color: "var(--muted)",
            padding: "2rem",
            fontSize: "1.4rem",
          }}
        >
          Nenhum evento encontrado.
        </td>
      </tr>
    </tbody>
  );
}
