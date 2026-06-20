type CardItemProps = {
  label: string;
  value: string | number;
};
const badges = ["signet"];

export default function CardItem({ label, value }: CardItemProps) {
  return (
    <div className={`detail-item ${value in badges ? "badge badge-rpc" : ""}`}>
      <span className="detail-label">{label}</span>
      <span className="detail-val badge badge-rpc">{value}</span>
    </div>
  );
}
