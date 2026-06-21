import { HelpCircle } from "lucide-react";
import CardItem from "../CardItem";

type CardProps = {
  title: string;
  icon: React.ReactNode;
  value: string;
  data: { label: string; value: string | number }[];
  helper: string;
};

export default function Card({ title, icon, value, data, helper }: CardProps) {
  return (
    <div className="card span-1">
      <div>
        <div className="card-header-row">
          <span className="card-title">{title}</span>
          <div className="card-icon-wrap">{icon}</div>
        </div>
        <div className="card-value">{value}</div>
        <div className="card-details">
          {data.map((item) => (
            <CardItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
        <div className="card-footer-desc">
          <HelpCircle size={14} />
          <span>{helper}</span>
        </div>
      </div>
    </div>
  );
}
