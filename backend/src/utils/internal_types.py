from dataclasses import dataclass
from typing import TypedDict


class RawMempool(TypedDict):
    vsize: int
    weight: int
    time: int
    height: int
    descendantcount: int
    descendantsize: int
    ancestorcount: int
    ancestorsize: int
    wtxid: str
    chunkweight: int
    fees: dict[str, float]
    depends: list[str]
    spentby: list[str]
    bip125_replaceable: bool
    unbroadcast: bool


class MempoolInfo(TypedDict):
    loaded: bool
    size: int
    bytes: int
    usage: int
    total_fee: float
    maxmempool: int
    mempoolminfee: float
    minrelaytxfee: float
    incrementalrelayfee: float
    unbroadcastcount: int
    fullrbf: bool
    permitbaremultisig: bool
    maxdatacarriersize: int
    limitclustercount: int
    limitclustersize: int
    optimal: bool


class PayloadError(TypedDict):
    ok: bool
    error: dict[str, str | None]


class ZMQStatus(TypedDict):
    last_zmq_ts: float
    last_seen_blockhash: str
    last_seen_block_ts: str
    count_blocks: int
    count_txs: int


@dataclass
class Event:
    topic: str
    value: str
    ts: float


class EventsSnapshot(TypedDict):
    blocks: list[Event]
    txs: list[Event]
    count_blocks: int
    count_txs: int
    last_seen_blockhash: str
    last_senn_block_ts: str
