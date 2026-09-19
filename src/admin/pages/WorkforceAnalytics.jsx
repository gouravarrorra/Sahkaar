import { useBooking } from '../../contexts/BookingContext';
import { serviceCategories } from '../../data/mockData';
import { BarChart3, TrendingUp, Users, Calendar, IndianRupee } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';

export default function WorkforceAnalytics() {
  const { bookings } = useBooking();

  // Service demand analysis
  const serviceDemand = serviceCategories.map(cat => {
    const count = bookings.filter(b => b.service === cat.id).length;
    return { ...cat, count };
  }).sort((a, b) => b.count - a.count);

  const maxDemand = Math.max(...serviceDemand.map(s => s.count), 1);

  // Performance metrics
  const performanceMetrics = [
    { label: 'Avg. Completion Time', value: '2.4 hrs', trend: '-12%', trendDir: 'down', good: true },
    { label: 'Customer Satisfaction', value: '4.45/5', trend: '+0.15', trendDir: 'up', good: true },
    { label: 'Worker Utilization', value: '72%', trend: '+5%', trendDir: 'up', good: true },
    { label: 'Cancellation Rate', value: '6.2%', trend: '+1.1%', trendDir: 'up', good: false },
    { label: 'Avg. Response Time', value: '14 min', trend: '-3 min', trendDir: 'down', good: true },
    { label: 'Repeat Booking Rate', value: '38%', trend: '+4%', trendDir: 'up', good: true },
  ];

  // Monthly revenue (simulated)
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const revenue = [45000, 52000, 61000, 58000, 72000, 84000];
  const maxRev = Math.max(...revenue);

  return (
    <>
      <AdminTopbar title="Analytics" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Workforce Analytics</h1>
            <p>Performance insights, demand trends, and revenue analysis</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Users} value="47" label="Active Workers" variant="primary" trend="+3 this week" trendDir="up" />
          <StatCard icon={Calendar} value={bookings.length} label="Total Bookings" variant="info" />
          <StatCard icon={IndianRupee} value="₹84K" label="This Month Revenue" variant="success" trend="+16.7%" trendDir="up" />
          <StatCard icon={TrendingUp} value="4.45" label="Avg Rating" variant="warning" />
        </div>

        {/* Service Demand Chart */}
        <div className="admin-section">
          <h3 className="admin-section__title"><BarChart3 size={16} /> Service Demand</h3>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {serviceDemand.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="text-sm" style={{ width: 110, textTransform: 'capitalize', flexShrink: 0 }}>{s.id.replace(/_/g, ' ')}</span>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-bar__fill" style={{ width: `${(s.count / maxDemand) * 100}%`, transition: 'width 0.8s ease' }} />
                    </div>
                    <span className="text-xs text-secondary" style={{ width: 30, textAlign: 'right' }}>{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="admin-section">
          <h3 className="admin-section__title"><TrendingUp size={16} /> Performance Metrics</h3>
          <div className="info-card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {performanceMetrics.map(m => (
              <Card key={m.label}>
                <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-1)' }}>{m.label}</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1, marginBottom: 'var(--space-1)' }}>{m.value}</p>
                <span className={`stat-card__trend stat-card__trend--${m.good ? 'up' : 'down'}`} style={{ color: m.good ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {m.trendDir === 'up' ? '↑' : '↓'} {m.trend}
                </span>
              </Card>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="admin-section">
          <h3 className="admin-section__title"><IndianRupee size={16} /> Revenue Trend (6 months)</h3>
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', height: 160, padding: 'var(--space-2) 0' }}>
              {months.map((m, i) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <span className="text-xs text-secondary">₹{(revenue[i] / 1000).toFixed(0)}K</span>
                  <div style={{
                    width: '100%', maxWidth: 40, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                    background: `linear-gradient(180deg, var(--color-primary), rgba(99, 102, 241, 0.4))`,
                    height: `${(revenue[i] / maxRev) * 120}px`,
                    transition: 'height 0.8s ease'
                  }} />
                  <span className="text-xs text-secondary">{m}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
