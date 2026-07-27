import contextlib
import os
import threading
import time
from collections import deque
from collections.abc import Callable
from dataclasses import asdict

import zmq

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


class ZMQSubscriber:
    def __init__(
        self, endpoint: str, topic: str, on_message_callback: Callable
    ):
        self.endpoint = endpoint
        self.topic = topic
        self.on_message_callback = on_message_callback
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):
        if self._thread and self._thread.is_alive():
            print(f"Subiscriber for '{self.topic}' is running.")
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._run, name=f"ZMQSub-{self.topic}", daemon=True
        )
        self._thread.start()

    def stop(self):
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)

    def _run(self):
        ctx = zmq.Context.instance()

        while not self._stop_event.is_set():
            sock = None
            try:
                sock = ctx.socket(zmq.SUB)
                sock.setsockopt(zmq.SUBSCRIBE, self.topic.encode("utf-8"))
                sock.setsockopt(zmq.RCVTIMEO, 1000)
                sock.connect(self.endpoint)

                while not self._stop_event.is_set():
                    try:
                        frames = sock.recv_multipart()
                        if len(frames) < 2:
                            continue

                        topic_b, body = frames[0], frames[1]
                        topic_s = topic_b.decode("utf-8", errors="replace")
                        value_hex = body.hex()
                        self.on_message_callback(
                            topic_s, value_hex, time.time()
                        )
                    except zmq.Again:
                        continue
                    except Exception as ex:
                        print(f"Error: {ex}")
                        break
            except Exception as ex:
                print(f"Error: {ex}")
            finally:
                if sock:
                    with contextlib.suppress(Exception):
                        sock.close(linger=0)

            if not self._stop_event.is_set():
                time.sleep(1.0)


class ZMQManager:
    def __init__(self):
        self._subscribers = []

    def register_subiscriber(
        self, endpoint: str, topic: str, callback: Callable
    ):
        subiscriber = ZMQSubscriber(endpoint, topic, callback)
        self._subscribers.append(subiscriber)

    def start_all(self):
        for sub in self._subscribers:
            sub.start()

    def stop_all(self):
        for sub in self._subscribers:
            sub.stop()
