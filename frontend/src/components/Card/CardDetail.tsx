import type { Item } from "../../types";
import CardItem from "./CardItem";

type CardDetailProps = {
  value: Array<Item>;
};

export default function CardDetail({ value }: CardDetailProps) {
  return (
    <div className="card-details">
      {value.map((item) => (
        <CardItem key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
