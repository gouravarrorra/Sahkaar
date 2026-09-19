import Card from '../../components/ui/Card';

export default function StatCard({ icon: Icon, value, label, trend, trendDir, variant = 'primary' }) {
  return (
    <Card className="stat-card">
      {Icon && (
        <div className={`stat-card__icon stat-card__icon--${variant}`}>
          <Icon size={18} />
        </div>
      )}
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
      {trend && (
        <span className={`stat-card__trend stat-card__trend--${trendDir || 'up'}`}>
          {trendDir === 'down' ? '↓' : '↑'} {trend}
        </span>
      )}
    </Card>
  );
}
