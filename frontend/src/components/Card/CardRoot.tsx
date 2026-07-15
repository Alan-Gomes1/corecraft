import { HelpCircle } from "lucide-react";

type CardRootProps = {
  children?: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  iconWrapStyle?: { color: string; background: string };
  value: React.ReactNode;
  cardValueStyle?: object;
  helper: string;
};

export default function CardRoot({
  children,
  title,
  icon,
  iconWrapStyle,
  value,
  cardValueStyle,
  helper,
}: CardRootProps) {
  return (
    <div className="card span-1">
      <div>
        <div className="card-header-row">
          <span className="card-title">{title}</span>
          <div className="card-icon-wrap" style={iconWrapStyle}>
            {icon}
          </div>
        </div>
        <div className="card-value" style={cardValueStyle}>
          {value}
        </div>
        {children}
        <div className="card-footer-desc">
          <HelpCircle size={14} />
          <span>{helper}</span>
        </div>
      </div>
    </div>
  );
}
