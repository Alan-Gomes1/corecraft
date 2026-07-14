import { Copy } from "lucide-react";

type CardCompareProps = {
  currentBestHash: string;
  handleCopyText: (text: string, description: string) => void;
};

export default function CardCompare({
  currentBestHash,
  handleCopyText,
}: CardCompareProps) {
  return (
    <>
      <div className="compare-box" style={{ marginTop: "1.6rem" }}>
        <div className="compare-header">
          <span>RPC Best Block Hash</span>
        </div>
        <div className="compare-value">
          <span>{currentBestHash}</span>
          <button
            className="copy-btn"
            onClick={() =>
              handleCopyText(currentBestHash, "PRC Best Block Hash")
            }
            title="Copiar Hash"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
      <div className="compare-box">
        <div className="compare-header">
          <span>ZMQ Last See Block</span>
        </div>
        <div className="compare-value">
          <span>{currentBestHash}</span>
          <button
            className="copy-btn"
            onClick={() =>
              handleCopyText(currentBestHash, "ZMQ Last See Block Hash")
            }
            title="Copiar Hash"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
