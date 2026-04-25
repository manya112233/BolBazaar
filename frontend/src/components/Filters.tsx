export default function Filters({
  query,
  setQuery,
  maxPrice,
  setMaxPrice,
}: {
  query: string;
  setQuery: (value: string) => void;
  maxPrice: number;
  setMaxPrice: (value: number) => void;
}) {
  return (
    <div className="filters card">
      <div>
        <label className="label">Search produce</label>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tomato, onion, spinach..." />
      </div>
      <div>
        <label className="label">Max price per kg</label>
        <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value || 0))} />
      </div>
    </div>
  );
}
