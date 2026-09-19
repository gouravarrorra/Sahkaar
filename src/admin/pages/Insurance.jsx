import { useState } from 'react';
import { ShieldPlus, IndianRupee, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';

const policies = [
  { id: 'INS-001', workerId: 'W10245', name: 'Rajesh Kumar', policyType: 'Accident Cover', premium: 200, coverage: 200000, status: 'active', renewDate: '2025-03-15' },
  { id: 'INS-002', workerId: 'W10248', name: 'Suresh Patel', policyType: 'Health Insurance', premium: 350, coverage: 500000, status: 'active', renewDate: '2025-01-10' },
  { id: 'INS-003', workerId: 'W10250', name: 'Amit Singh', policyType: 'Accident Cover', premium: 200, coverage: 200000, status: 'lapsed', renewDate: '2024-06-20' },
  { id: 'INS-004', workerId: 'W10252', name: 'Priya Sharma', policyType: 'Health Insurance', premium: 350, coverage: 500000, status: 'active', renewDate: '2025-07-01' },
  { id: 'INS-005', workerId: 'W10255', name: 'Vikram Yadav', policyType: 'Accident Cover', premium: 200, coverage: 200000, status: 'claim_pending', renewDate: '2025-05-12' },
];

const claims = [
  { id: 'CLM-001', policyId: 'INS-005', worker: 'Vikram Yadav', type: 'Accident', amount: 15000, filedDate: '2024-09-10', status: 'under_review' },
  { id: 'CLM-002', policyId: 'INS-002', worker: 'Suresh Patel', type: 'Hospitalization', amount: 35000, filedDate: '2024-08-20', status: 'approved' },
];

export default function Insurance() {
  const [tab, setTab] = useState('policies');

  const policyColumns = [
    { key: 'id', header: 'Policy ID', accessor: 'id' },
    { key: 'name', header: 'Worker', accessor: 'name' },
    { key: 'policyType', header: 'Type', accessor: 'policyType' },
    { key: 'premium', header: 'Premium/mo', accessor: 'premium', cellClass: 'currency', render: r => `₹${r.premium}` },
    { key: 'coverage', header: 'Coverage', accessor: 'coverage', cellClass: 'currency', render: r => `₹${(r.coverage / 1000).toFixed(0)}K` },
    { key: 'renewDate', header: 'Renewal', accessor: 'renewDate' },
    { key: 'status', header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status === 'lapsed' ? 'expired' : r.status === 'claim_pending' ? 'warning' : 'active'} size="sm" /> },
  ];

  const claimColumns = [
    { key: 'id', header: 'Claim ID', accessor: 'id' },
    { key: 'worker', header: 'Worker', accessor: 'worker' },
    { key: 'type', header: 'Type', accessor: 'type' },
    { key: 'amount', header: 'Amount', accessor: 'amount', cellClass: 'currency', render: r => `₹${r.amount.toLocaleString()}` },
    { key: 'filedDate', header: 'Filed', accessor: 'filedDate' },
    { key: 'status', header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status === 'approved' ? 'active' : 'pending'} size="sm" /> },
    { key: 'actions', header: '', sortable: false, render: r => r.status === 'under_review' ? (
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <Button size="sm" variant="ghost">Approve</Button>
        <Button size="sm" variant="ghost">Reject</Button>
      </div>
    ) : null },
  ];

  return (
    <>
      <AdminTopbar title="Insurance" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Insurance Administration</h1>
            <p>Policy management, premium tracking, and claim processing</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={ShieldPlus} value={policies.filter(p => p.status === 'active').length} label="Active Policies" variant="success" />
          <StatCard icon={IndianRupee} value={`₹${policies.filter(p => p.status === 'active').reduce((s, p) => s + p.premium, 0)}`} label="Monthly Premiums" variant="primary" />
          <StatCard icon={Clock} value={claims.filter(c => c.status === 'under_review').length} label="Pending Claims" variant="warning" />
          <StatCard icon={AlertTriangle} value={policies.filter(p => p.status === 'lapsed').length} label="Lapsed" variant="error" />
        </div>

        <div className="filters-bar">
          {['policies', 'claims'].map(f => (
            <button key={f} className={`filter-chip ${tab === f ? 'filter-chip--active' : ''}`}
              onClick={() => setTab(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {tab === 'policies'
          ? <DataTable columns={policyColumns} data={policies} searchable searchPlaceholder="Search policies..." />
          : <DataTable columns={claimColumns} data={claims} searchable searchPlaceholder="Search claims..." />
        }
      </div>
    </>
  );
}
