import { useState } from 'react';
import { LifeBuoy, Clock, CheckCircle2, AlertTriangle, MessageCircle } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const tickets = [
  { id: 'TKT-001', subject: 'Payment not received for booking BK-003', from: 'Rajesh Kumar', fromType: 'Worker', createdAt: '2024-09-18', priority: 'high', status: 'open', lastUpdate: '2 hrs ago' },
  { id: 'TKT-002', subject: 'Worker did not arrive on time', from: 'Anita Gupta', fromType: 'Customer', createdAt: '2024-09-17', priority: 'medium', status: 'in_progress', lastUpdate: '5 hrs ago' },
  { id: 'TKT-003', subject: 'Unable to update profile photo', from: 'Suresh Patel', fromType: 'Worker', createdAt: '2024-09-16', priority: 'low', status: 'resolved', lastUpdate: '1 day ago' },
  { id: 'TKT-004', subject: 'Overcharged for plumbing service', from: 'Kavita Devi', fromType: 'Customer', createdAt: '2024-09-18', priority: 'high', status: 'open', lastUpdate: '30 min ago' },
  { id: 'TKT-005', subject: 'Certificate renewal not reflecting', from: 'Amit Singh', fromType: 'Worker', createdAt: '2024-09-15', priority: 'medium', status: 'escalated', lastUpdate: '3 hrs ago' },
];

export default function Support() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const columns = [
    { key: 'id', header: 'Ticket ID', accessor: 'id' },
    { key: 'subject', header: 'Subject', accessor: 'subject', render: row => (
      <div style={{ maxWidth: 250 }}>
        <span className="font-medium text-sm">{row.subject}</span>
      </div>
    )},
    { key: 'from', header: 'From', accessor: 'from', render: row => (
      <div>
        <span className="text-sm">{row.from}</span>
        <p className="text-xs text-secondary">{row.fromType}</p>
      </div>
    )},
    { key: 'priority', header: 'Priority', accessor: 'priority', render: row => (
      <StatusBadge status={row.priority === 'high' ? 'error' : row.priority === 'medium' ? 'warning' : 'active'} size="sm" />
    )},
    { key: 'status', header: 'Status', accessor: 'status', render: row => (
      <StatusBadge status={row.status === 'open' ? 'pending' : row.status === 'in_progress' ? 'working' : row.status === 'escalated' ? 'error' : 'completed'} size="sm" />
    )},
    { key: 'lastUpdate', header: 'Last Update', accessor: 'lastUpdate' },
    { key: 'actions', header: '', sortable: false, render: row => row.status !== 'resolved' ? (
      <Button size="sm" variant="ghost" icon={MessageCircle}>Reply</Button>
    ) : null },
  ];

  return (
    <>
      <AdminTopbar title="Support" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Support Tickets</h1>
            <p>Worker and customer support ticket management</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={LifeBuoy} value={tickets.length} label="Total Tickets" variant="primary" />
          <StatCard icon={Clock} value={tickets.filter(t => t.status === 'open').length} label="Open" variant="warning" />
          <StatCard icon={AlertTriangle} value={tickets.filter(t => t.status === 'escalated').length} label="Escalated" variant="error" />
          <StatCard icon={CheckCircle2} value={tickets.filter(t => t.status === 'resolved').length} label="Resolved" variant="success" />
        </div>

        <div className="filters-bar">
          {['all', 'open', 'in_progress', 'escalated', 'resolved'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search tickets..." />
      </div>
    </>
  );
}
