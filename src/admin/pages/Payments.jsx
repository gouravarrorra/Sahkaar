import { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2 } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

const transactions = [
  { id: 'TXN-001', bookingId: 'BK-001', workerName: 'Rajesh Kumar', amount: 650, type: 'service_payment', status: 'completed', date: '2024-09-18', method: 'UPI' },
  { id: 'TXN-002', bookingId: 'BK-002', workerName: 'Suresh Patel', amount: 480, type: 'service_payment', status: 'completed', date: '2024-09-17', method: 'Cash' },
  { id: 'TXN-003', bookingId: 'BK-003', workerName: 'Amit Singh', amount: 520, type: 'payout', status: 'pending', date: '2024-09-18', method: 'Bank Transfer' },
  { id: 'TXN-004', bookingId: 'BK-001', workerName: 'Rajesh Kumar', amount: 585, type: 'payout', status: 'completed', date: '2024-09-18', method: 'Bank Transfer' },
  { id: 'TXN-005', bookingId: '-', workerName: 'Priya Sharma', amount: 150, type: 'welfare_contribution', status: 'completed', date: '2024-09-16', method: 'Auto-deduct' },
  { id: 'TXN-006', bookingId: 'BK-004', workerName: 'Vikram Yadav', amount: 350, type: 'service_payment', status: 'disputed', date: '2024-09-15', method: 'UPI' },
];

export default function Payments() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const columns = [
    { key: 'id', header: 'Transaction ID', accessor: 'id' },
    { key: 'worker', header: 'Worker', accessor: 'workerName' },
    { key: 'type', header: 'Type', accessor: 'type', render: row => (
      <span className="text-xs" style={{ textTransform: 'capitalize' }}>{row.type.replace(/_/g, ' ')}</span>
    )},
    { key: 'method', header: 'Method', accessor: 'method' },
    { key: 'amount', header: 'Amount', accessor: 'amount', cellClass: 'currency', render: row => `₹${row.amount}` },
    { key: 'date', header: 'Date', accessor: 'date' },
    { key: 'status', header: 'Status', accessor: 'status', render: row => <StatusBadge status={row.status === 'disputed' ? 'error' : row.status} size="sm" /> },
  ];

  return (
    <>
      <AdminTopbar title="Payments" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Payment Ledger</h1>
            <p>Transaction history, pending payouts, and dispute management</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={ArrowUpRight} value="₹1,24,500" label="Collected" variant="success" trend="+18% this month" trendDir="up" />
          <StatCard icon={ArrowDownRight} value="₹1,08,200" label="Paid Out" variant="primary" />
          <StatCard icon={Clock} value="₹5,200" label="Pending Payouts" variant="warning" />
          <StatCard icon={Wallet} value="₹16,300" label="Platform Revenue" variant="info" />
        </div>

        <div className="filters-bar">
          {['all', 'service_payment', 'payout', 'welfare_contribution'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search transactions..." />
      </div>
    </>
  );
}
