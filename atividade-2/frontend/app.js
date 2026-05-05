async function getJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return await r.json();
}

function shortHex(h) {
  if (!h) return "—";
  if (h.length <= 20) return h;
  return h.slice(0, 10) + "…" + h.slice(-10);
}

function tsToLocal(ts) {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return d.toLocaleString();
}

function renderList(el, items, label) {
  el.innerHTML = "";
  if (!items || items.length === 0) {
    el.innerHTML = `<div class="muted">Nenhum evento ainda. (Em signet/mainnet isso aparece naturalmente; em regtest, gere blocos/txs.)</div>`;
    return;
  }
  for (const it of items) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="mono">${shortHex(it.value)}</div>
      <div class="badge">${label} • ${tsToLocal(it.ts)}</div>
    `;
    el.appendChild(row);
  }
}

async function refresh() {
  const [health, state, summary, latest, comparison] = await Promise.all([
    getJSON("/api/health"),
    getJSON("/api/state"),
    getJSON("/api/events/summary").catch(() => null),
    getJSON("/api/events/latest").catch(() => null),
    getJSON("/api/events/state-comparison").catch(() => null),
  ]);

  const pill = document.getElementById("healthPill");
  if (health.rpc_ok) {
    const age =
      health.zmq_last_event_age_s === null ||
      health.zmq_last_event_age_s === undefined
        ? "—"
        : `${health.zmq_last_event_age_s}s`;
    pill.textContent = `RPC ok • ZMQ age: ${age}`;
    pill.style.borderColor = "rgba(110,243,165,.28)";
  } else {
    pill.textContent = `RPC falhou • ${String(health.rpc_error || "").slice(0, 80)}`;
    pill.style.borderColor = "rgba(255,107,107,.35)";
  }

  const rpc = state.rpc || {};
  document.getElementById("chain").textContent = rpc.chain ?? "—";
  document.getElementById("height").textContent = rpc.height ?? "—";
  document.getElementById("bestblockhash").textContent =
    rpc.bestblockhash ?? "—";
  document.getElementById("mempoolSize").textContent = rpc.mempool_size ?? "—";

  const zmq = state.zmq || {};
  document.getElementById("lastSeenBlock").textContent =
    zmq.last_seen_blockhash ?? "—";
  document.getElementById("blockCount").textContent =
    zmq.counters?.block_events ?? "—";
  document.getElementById("txCount").textContent =
    zmq.counters?.tx_events ?? "—";

  const warn = document.getElementById("divergenceWarn");
  warn.style.display = state.analysis?.bestblock_vs_last_seen_diverged
    ? "block"
    : "none";

  renderList(
    document.getElementById("blockList"),
    zmq.blocks || [],
    "hashblock",
  );
  renderList(document.getElementById("txList"), zmq.txs || [], "hashtx");

  // Resumo de eventos
  if (summary) {
    document.getElementById("sumBlocksObs").textContent =
      summary.blocks_observed ?? "—";
    document.getElementById("sumTxsObs").textContent =
      summary.txs_observed ?? "—";
    document.getElementById("sumTxPerSec").textContent =
      summary.tx_per_second !== null && summary.tx_per_second !== undefined
        ? `${summary.tx_per_second} tx/s`
        : "—";
    document.getElementById("sumLastEvent").textContent = tsToLocal(
      summary.last_event_time,
    );
  }

  // Comparação RPC vs ZMQ
  if (comparison && !comparison.error) {
    document.getElementById("cmpBest").textContent = shortHex(
      comparison.best_block,
    );
    document.getElementById("cmpSeen").textContent = shortHex(
      comparison.last_seen_block,
    );
    const div = comparison.diverged;
    const cmpEl = document.getElementById("cmpDiverged");
    cmpEl.textContent = div === null ? "—" : div ? "sim ⚠" : "não ✓";
    cmpEl.style.color = div ? "#ffcc66" : div === false ? "#6ef3a5" : "";
    document.getElementById("cmpWarn").style.display = div ? "block" : "none";
  }

  // Últimos Eventos
  if (latest) {
    const latestBlocks = (latest.blocks || []).map((b) => ({
      value: b.hash,
      ts: b.ts,
    }));
    const latestTxs = (latest.txs || []).map((t) => ({
      value: t.txid,
      ts: t.ts,
    }));
    renderList(
      document.getElementById("eventBlockList"),
      latestBlocks,
      "hashblock",
    );
    renderList(document.getElementById("eventTxList"), latestTxs, "hashtx");
  }

  document.getElementById("serverTime").textContent =
    `server_time: ${tsToLocal(state.server_time)}`;
}

document
  .getElementById("btnRefresh")
  .addEventListener("click", () => refresh().catch(console.error));

refresh().catch(console.error);
setInterval(() => refresh().catch(() => {}), 1500);
