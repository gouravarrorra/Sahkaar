import { useState } from 'react';
import { ScrollText, Shield, Clock, Filter } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const auditLogs = [
  { id: 'AL-001', timestamp: '2024-09-18 14:32:01', actor: 'Admin: Gourav Arora', action: 'Published scheme', target: 'PM Vishwakarma Yojana', category: 'schemes', ip: '192.168.1.45' },
  { id: 'AL-002', timestamp: '2024-09-18 13:15:22', actor: 'Admin: Gourav Arora', action: 'Approved verification', target: 'Worker W10245 — Aadhaar', category: 'verification', ip: '192.168.1.45' },
  { id: 'AL-003', timestamp: '2024-09-18 12:05:10', actor: 'System', action: 'Price band auto-adjusted', target: 'Electrician — ₹250→₹275', category: 'pricing', ip: '-' },
  { id: 'AL-004', timestamp: '2024-09-18 11:30:00', actor: 'Admin: Gourav Arora', action: 'Login', target: 'Admin Portal', category: 'auth', ip: '192.168.1.45' },
  { id: 'AL-005', timestamp: '2024-09-17 16:45:33', actor: 'Admin: Gourav Arora', action: 'Updated travel cost rule', target: 'Base rate: ₹7→₹8/km', category: 'settings', ip: '192.168.1.45' },
  { id: 'AL-006', timestamp: '2024-09-17 15:20:11', actor: 'System', action: 'Cartel detection alert', target: '3 workers flagged in plumber category', category: 'pricing', ip: '-' },
  { id: 'AL-007', timestamp: '2024-09-17 14:00:00', actor: 'Admin: Gourav Arora', action: 'Rejected verification', target: 'Worker W10252 — Skill Certificate (blurry doc)', category: 'verification', ip: '192.168.1.45' },
  { id: 'AL-008', timestamp: '2024-09-17 10:12:45', actor: 'Admin: Gourav Arora', action: 'Created training program', target: 'Digital Payments & UPI Workshop', category: 'training', ip: '192.168.1.45' },
  { id: 'AL-009', timestamp: '2024-09-16 18:30:00', actor: 'System', action: 'Insurance policy lapsed', target: 'Worker W10250 — Accident Cover', category: 'insurance', ip: '-' },
  { id: 'AL-010', timestamp: '2024-09-16 09:00:00', actor: 'Admin: Gourav Arora', action: 'Login', target: 'Admin Portal', category: 'auth', ip: '192.168.1.45' },
];

export default function AuditLogs() {
  const [catFilter, setCatFilter] = useState('all');
  const categories = ['all', ...new Set(auditLogs.map(l => l.category))];
  const filtered = catFilter === 'all' ? auditLogs : auditLogs.filter(l => l.category === catFilter);

  const columns = [
    { key: 'timestamp', header: 'Timestamp', accessor: 'timestamp', render: row => (
      <span className="text-xs" style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{row.timestamp}</span>
    )},
    { key: 'actor', header: 'Actor', accessor: 'actor', render: row => (
      <span className={`text-sm ${row.actor === 'System' ? 'text-secondary' : 'font-medium'}`}>{row.actor}</span>
    )},
    { key: 'action', header: 'Action', accessor: 'action' },
    { key: 'target', header: 'Target', accessor: 'target', render: row => (
      <span className="text-xs text-secondary" style={{ maxWidth: 200, display: 'block' }}>{row.target}</span>
    )},
    { key: 'category', header: 'Category', accessor: 'category', render: row => (
      <span className="text-xs" style={{ textTransform: 'capitalize', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--bg-hover)' }}>{row.category}</span>
    )},
    { key: 'ip', header: 'IP', accessor: 'ip', render: row => <span className="text-xs text-tertiary">{row.ip}</span> },
  ];

  return (
    <>
      <AdminTopbar title="Audit Logs" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Audit Logs</h1>
            <p>Complete system-wide audit trail — all admin actions, system events, and data changes</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={ScrollText} value={auditLogs.length} label="Total Entries" variant="primary" />
          <StatCard icon={Shield} value={auditLogs.filter(l => l.actor !== 'System').length} label="Admin Actions" variant="info" />
          <StatCard icon={Clock} value={auditLogs.filter(l => l.actor === 'System').length} label="System Events" variant="warning" />
        </div>

        <div className="filters-bar">
          {categories.map(c => (
            <button key={c} className={`filter-chip ${catFilter === c ? 'filter-chip--active' : ''}`}
              onClick={() => setCatFilter(c)} style={{ textTransform: 'capitalize' }}>
              {c}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search logs..." emptyMessage="No audit log entries found." />
      </div>
    </>
  );
}
