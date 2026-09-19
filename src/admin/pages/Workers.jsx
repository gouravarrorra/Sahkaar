import { useState } from 'react';
import { mockWorkers } from '../../data/mockData';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users, Search, ShieldCheck, Star, MapPin } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const workerList = Object.values(mockWorkers).map(w => ({
  ...w,
  status: w.verified ? 'verified' : 'pending',
  joinDate: '2024-08-15',
  completedJobs: Math.floor(Math.random() * 80) + 10,
}));

export default function Workers() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? workerList
    : filter === 'verified' ? workerList.filter(w => w.verified)
    : workerList.filter(w => !w.verified);

  const columns = [
    { key: 'id', header: 'ID', accessor: 'id' },
    { key: 'name', header: 'Name', accessor: 'name', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
          {row.name?.charAt(0)}
        </div>
        <span className="font-medium">{row.name}</span>
      </div>
    )},
    { key: 'skills', header: 'Skills', accessor: row => row.skills?.join(', ') || '-', render: row => (
      <span className="text-xs">{row.skills?.map(s => s.replace(/_/g, ' ')).join(', ')}</span>
    )},
    { key: 'rating', header: 'Rating', accessor: 'rating', render: row => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Star size={12} fill="var(--color-warning)" stroke="var(--color-warning)" /> {row.rating}
      </span>
    )},
    { key: 'jobs', header: 'Jobs', accessor: 'completedJobs', cellClass: 'currency' },
    { key: 'status', header: 'Status', accessor: 'status', render: row => <StatusBadge status={row.status} size="sm" /> },
    { key: 'actions', header: '', sortable: false, render: row => (
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <Button size="sm" variant="ghost">View</Button>
      </div>
    )},
  ];

  return (
    <>
      <AdminTopbar title="Worker Registry" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Worker Registry</h1>
            <p>Manage all registered SAHKAAR workers</p>
          </div>
          <div className="admin-page-header__actions">
            <Button icon={Users}>Add Worker</Button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Users} value={workerList.length} label="Total Workers" variant="primary" />
          <StatCard icon={ShieldCheck} value={workerList.filter(w => w.verified).length} label="Verified" variant="success" />
          <StatCard icon={Star} value="4.3" label="Avg Rating" variant="warning" />
          <StatCard icon={MapPin} value="12" label="Service Areas" variant="info" />
        </div>

        <div className="filters-bar">
          {['all', 'verified', 'pending'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f} ({f === 'all' ? workerList.length : f === 'verified' ? workerList.filter(w => w.verified).length : workerList.filter(w => !w.verified).length})
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search workers..." emptyMessage="No workers found." />
      </div>
    </>
  );
}
