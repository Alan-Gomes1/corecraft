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
