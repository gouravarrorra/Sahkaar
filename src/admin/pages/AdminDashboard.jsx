import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { useSchemes } from '../../contexts/SchemesContext';
import { usePricing } from '../../contexts/PricingContext';
import {
  Users, CalendarCheck, IndianRupee, Landmark, AlertTriangle,
  TrendingUp, Clock, CheckCircle2, ArrowRight
} from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { bookings } = useBooking();
  const { getSchemeStats } = useSchemes();
  const { pricingStats } = usePricing();
  const admin = getUser();

  const schemeStats = getSchemeStats(admin?.communityId);
  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status)).length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  const quickActions = [
    { label: 'Worker Registry', path: '/admin/workers', icon: Users },
    { label: 'View Bookings', path: '/admin/bookings', icon: CalendarCheck },
    { label: 'Pricing Governance', path: '/admin/pricing', icon: IndianRupee },
    { label: 'Govt Schemes', path: '/admin/schemes', icon: Landmark },
  ];

  const recentActivity = [
    { id: 1, action: 'New worker registration', detail: 'Rajesh Kumar applied for verification', time: '2 min ago', type: 'info' },
    { id: 2, action: 'Booking completed', detail: 'Electrician service — BK-001', time: '15 min ago', type: 'success' },
    { id: 3, action: 'Price proposal submitted', detail: 'Worker W10245 proposed ₹320 for plumber', time: '1 hr ago', type: 'warning' },
    { id: 4, action: 'Scheme published', detail: 'PM Vishwakarma Yojana now live', time: '3 hrs ago', type: 'success' },
    { id: 5, action: 'Verification pending', detail: '3 workers awaiting document review', time: '5 hrs ago', type: 'warning' },
  ];

  return (
    <>
      <AdminTopbar title="Dashboard" />
      <div className="admin-content__body animate-fade-in">
        {/* Welcome */}
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Welcome back, {admin?.name}</h1>
            <p>{admin?.communityName} — SAHKAAR Admin Portal</p>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard icon={Users} value="47" label="Active Workers" variant="primary" trend="+3 this week" trendDir="up" />
          <StatCard icon={CalendarCheck} value={activeBookings} label="Active Bookings" variant="info" />
          <StatCard icon={CheckCircle2} value={completedBookings} label="Completed" variant="success" trend="+12 this month" trendDir="up" />
          <StatCard icon={IndianRupee} value={pricingStats.activeProposals} label="Price Proposals" variant="warning" />
          <StatCard icon={Landmark} value={schemeStats.published} label="Published Schemes" variant="success" />
          <StatCard icon={AlertTriangle} value="3" label="Pending Actions" variant="error" />
        </div>

        {/* Quick Actions */}
        <div className="admin-section">
          <h3 className="admin-section__title">Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
            {quickActions.map(qa => (
              <Card key={qa.path} style={{ cursor: 'pointer', transition: 'transform 0.15s' }} onClick={() => navigate(qa.path)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2)' }}>
                  <div className="stat-card__icon stat-card__icon--primary">
                    <qa.icon size={18} />
                  </div>
                  <span className="text-sm font-semibold" style={{ flex: 1 }}>{qa.label}</span>
                  <ArrowRight size={16} className="text-tertiary" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-section">
          <h3 className="admin-section__title"><Clock size={16} /> Recent Activity</h3>
          <Card>
            <div className="admin-timeline">
              {recentActivity.map(item => (
                <div key={item.id} className="admin-timeline__item">
                  <div className="admin-timeline__dot" style={{
                    background: item.type === 'success' ? 'var(--color-success)' : item.type === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)'
                  }} />
                  <div className="admin-timeline__item-title">{item.action}</div>
                  <div className="admin-timeline__item-meta">{item.detail} • {item.time}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* System Health */}
        <div className="admin-section">
          <h3 className="admin-section__title"><TrendingUp size={16} /> System Health</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-3)' }}>
            <Card>
              <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-2)' }}>Worker Utilization</p>
              <div className="progress-bar"><div className="progress-bar__fill progress-bar__fill--success" style={{ width: '72%' }} /></div>
              <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-1)' }}>72% — 34 of 47 workers had bookings this week</p>
            </Card>
            <Card>
              <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-2)' }}>Service Satisfaction</p>
              <div className="progress-bar"><div className="progress-bar__fill" style={{ width: '89%' }} /></div>
              <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-1)' }}>4.45/5 avg rating across all services</p>
            </Card>
            <Card>
              <p className="text-sm font-semibold" style={{ marginBottom: 'var(--space-2)' }}>Payment Collection</p>
              <div className="progress-bar"><div className="progress-bar__fill progress-bar__fill--warning" style={{ width: '64%' }} /></div>
              <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-1)' }}>₹1,24,500 collected of ₹1,94,200 invoiced</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
