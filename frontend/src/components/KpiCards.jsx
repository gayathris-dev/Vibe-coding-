export default function KpiCards({ items = [] }) {
  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <div key={item.label} className={`kpi-card kpi-card--${item.tone || 'default'}`}>
          <span className="kpi-card__value">{item.value}</span>
          <span className="kpi-card__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}