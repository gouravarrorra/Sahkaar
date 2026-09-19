import { useState } from 'react';
import { Award, Calendar, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const certifications = [
  { id: 'CRT-001', workerId: 'W10245', name: 'Rajesh Kumar', certType: 'Electrical Safety', issuedAt: '2024-03-15', expiresAt: '2025-03-15', status: 'active' },
  { id: 'CRT-002', workerId: 'W10248', name: 'Suresh Patel', certType: 'Plumbing Advanced', issuedAt: '2024-01-10', expiresAt: '2025-01-10', status: 'active' },
  { id: 'CRT-003', workerId: 'W10250', name: 'Amit Singh', certType: 'Carpentry Grade A', issuedAt: '2023-06-20', expiresAt: '2024-06-20', status: 'expired' },
  { id: 'CRT-004', workerId: 'W10252', name: 'Priya Sharma', certType: 'Home Care Basics', issuedAt: '2024-07-01', expiresAt: '2025-07-01', status: 'active' },
  { id: 'CRT-005', workerId: 'W10255', name: 'Vikram Yadav', certType: 'Electrical Safety', issuedAt: '2024-05-12', expiresAt: '2024-11-12', status: 'expiring_soon' },
];

export default function Certifications() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? certifications : certifications.filter(c => c.status === filter);

  const columns = [
    { key: 'id', header: 'Cert ID', accessor: 'id' },
    { key: 'name', header: 'Worker', accessor: 'name' },
    { key: 'certType', header: 'Certification', accessor: 'certType' },
    { key: 'issuedAt', header: 'Issued', accessor: 'issuedAt' },
    { key: 'expiresAt', header: 'Expires', accessor: 'expiresAt' },
    { key: 'status', header: 'Status', accessor: 'status', render: row => (
      <StatusBadge status={row.status === 'expiring_soon' ? 'warning' : row.status === 'expired' ? 'expired' : 'active'} size="sm" />
    )},
    { key: 'actions', header: '', sortable: false, render: () => <Button size="sm" variant="ghost">Renew</Button> },
  ];

  return (
    <>
      <AdminTopbar title="Certifications" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Skill Certifications</h1>
            <p>Manage worker certifications, track expiry, and issue renewals</p>
          </div>
          <div className="admin-page-header__actions">
            <Button icon={Plus}>Issue Certificate</Button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Award} value={certifications.length} label="Total Certs" variant="primary" />
          <StatCard icon={CheckCircle2} value={certifications.filter(c => c.status === 'active').length} label="Active" variant="success" />
          <StatCard icon={Calendar} value={certifications.filter(c => c.status === 'expiring_soon').length} label="Expiring Soon" variant="warning" />
          <StatCard icon={AlertTriangle} value={certifications.filter(c => c.status === 'expired').length} label="Expired" variant="error" />
        </div>

        <div className="filters-bar">
          {['all', 'active', 'expiring_soon', 'expired'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search certifications..." />
      </div>
    </>
  );
}
