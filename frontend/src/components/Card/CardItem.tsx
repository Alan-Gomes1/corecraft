type CardItemProps = {
  label: string;
  value: string | number;
};
const badges = ["signet"];

export default function CardItem({ label, value }: CardItemProps) {
  const isHash = label.toLowerCase().includes("hash");
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span
        className={`detail-val ${
          badges.includes(String(value)) ? "badge badge-rpc" : ""
        } ${isHash ? "hash" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
