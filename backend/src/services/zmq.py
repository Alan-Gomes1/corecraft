import os
import threading
from collections import deque
from dataclasses import asdict

from utils.internal_types import Event, EventsSnapshot, ZMQStatus

MAX_BLOCK_EVENTS = int(os.getenv("MAX_BLOCK_EVENTS", "25"))
MAX_TX_EVENTS = int(os.getenv("MAX_TX_EVENTS", "60"))


class InMemoryState:
    def __init__(self):
        self._lock = threading.Lock()
        self._blocks = deque(maxlen=MAX_BLOCK_EVENTS)
        self._txs = deque(maxlen=MAX_TX_EVENTS)
        self._count_blocks = 0
        self._count_txs = 0
        self._last_zmq_ts = None
        self._last_seen_blockhash = None
        self._last_seen_block_ts = None

    def register_event(self, topic: str, value_hex: str, ts: float) -> None:
        """
        Thread-safe method to register a new ZMQ event and update state.

        Args:
            topic (str): The topic of the ZMQ event.
            value_hex (str): The hexadecimal value of the ZMQ event.
            ts (float): The timestamp of the ZMQ event.
        """
        event = Event(topic=topic, value=value_hex, ts=ts)
        with self._lock:
            self._last_zmq_ts = ts
            if topic == "hashblock":
                self._blocks.appendleft(event)
                self._count_blocks += 1
                self._last_seen_blockhash = value_hex
                self._last_seen_block_ts = ts
            elif topic == "hashtx":
                self._txs.appendleft(event)
                self._count_txs += 1
            print(f"ZMQ Event registered: {topic} -> {value_hex[:16]}...")

    def get_zmq_status(self) -> ZMQStatus:
        """
        Returns the high-level ZMQ status.
        """
        with self._lock:
            zmq_status = ZMQStatus(
                last_zmq_ts=self._last_zmq_ts,
                last_seen_blockhash=self._last_seen_blockhash,
                last_seen_block_ts=self._last_seen_block_ts,
                count_blocks=self._count_blocks,
                count_txs=self._count_txs,
            )
            return zmq_status

    def get_events_snapshot(self) -> EventsSnapshot:
        """
        Returns a snapshot of the historical logs.
        """
        logs = EventsSnapshot(
            blocks=[asdict(ev) for ev in list(self._blocks)],
            txs=[asdict(ev) for ev in list(self._txs)],
            count_blocks=self._count_blocks,
            count_txs=self._count_txs,
            last_seen_blockhash=self._last_seen_blockhash,
            last_senn_block_ts=self._last_seen_block_ts,
        )
        return logs

    def get_latest_events(self):
        """
        Returns simplified list of the last events.
        """
        with self._lock:
            return {
                "blocks": [
                    {"hash": ev.value, "ts": ev.ts} for ev in self._blocks
                ],
                "txs": [{"txid": ev.value, "ts": ev.ts} for ev in self._txs],
            }

    def get_txs_for_rate(self) -> tuple[list[Event], int, int, float]:
        """
        Returns tx list and counters for rate computation.
        """
        with self._lock:
            return (
                list(self._txs),
                self._count_blocks,
                self._count_txs,
                self._last_zmq_ts,
            )
