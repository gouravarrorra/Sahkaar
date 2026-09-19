import { useState } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, Eye } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const verificationQueue = [
  { id: 'VR-001', workerId: 'W10245', name: 'Rajesh Kumar', docType: 'Aadhaar Card', submittedAt: '2024-09-18', status: 'pending_review', urgency: 'normal' },
  { id: 'VR-002', workerId: 'W10248', name: 'Suresh Patel', docType: 'PAN Card', submittedAt: '2024-09-17', status: 'pending_review', urgency: 'high' },
  { id: 'VR-003', workerId: 'W10250', name: 'Amit Singh', docType: 'Aadhaar Card', submittedAt: '2024-09-16', status: 'approved', urgency: 'normal' },
  { id: 'VR-004', workerId: 'W10252', name: 'Priya Sharma', docType: 'Skill Certificate', submittedAt: '2024-09-15', status: 'rejected', urgency: 'normal' },
  { id: 'VR-005', workerId: 'W10255', name: 'Vikram Yadav', docType: 'Address Proof', submittedAt: '2024-09-18', status: 'pending_review', urgency: 'high' },
];

export default function Verification() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? verificationQueue : verificationQueue.filter(v => v.status === filter);

  const columns = [
    { key: 'id', header: 'Request ID', accessor: 'id' },
    { key: 'name', header: 'Worker', accessor: 'name' },
    { key: 'docType', header: 'Document', accessor: 'docType' },
    { key: 'submittedAt', header: 'Submitted', accessor: 'submittedAt' },
    { key: 'urgency', header: 'Urgency', accessor: 'urgency', render: row => (
      <StatusBadge status={row.urgency === 'high' ? 'high' : 'low'} size="sm" />
    )},
    { key: 'status', header: 'Status', accessor: 'status', render: row => <StatusBadge status={row.status} size="sm" /> },
    { key: 'actions', header: '', sortable: false, render: row => (
      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
        <button className="action-btn" title="View"><Eye size={16} /></button>
        {row.status === 'pending_review' && (
          <>
            <button className="action-btn" title="Approve"><CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} /></button>
            <button className="action-btn action-btn--danger" title="Reject"><XCircle size={16} /></button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <>
      <AdminTopbar title="Verification" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Worker Verification</h1>
            <p>Review and verify worker identity documents</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Clock} value={verificationQueue.filter(v => v.status === 'pending_review').length} label="Pending Review" variant="warning" />
          <StatCard icon={CheckCircle2} value={verificationQueue.filter(v => v.status === 'approved').length} label="Approved" variant="success" />
          <StatCard icon={XCircle} value={verificationQueue.filter(v => v.status === 'rejected').length} label="Rejected" variant="error" />
          <StatCard icon={ShieldCheck} value="98%" label="Approval Rate" variant="primary" />
        </div>

        <div className="filters-bar">
          {['all', 'pending_review', 'approved', 'rejected'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search by name or document..." />
      </div>
    </>
  );
}
