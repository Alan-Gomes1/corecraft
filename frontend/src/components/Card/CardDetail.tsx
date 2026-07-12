import CardItem from "./CardItem";

export type Item = {
  label: string;
  value: string | number;
};

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
