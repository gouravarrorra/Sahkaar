import { useState } from 'react';
import { useBooking } from '../../contexts/BookingContext';
import { CalendarCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Bookings() {
  const { bookings } = useBooking();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const columns = [
    { key: 'id', header: 'Booking ID', accessor: 'id' },
    { key: 'service', header: 'Service', accessor: row => row.service?.replace(/_/g, ' ') || '-', render: row => (
      <span style={{ textTransform: 'capitalize' }}>{row.service?.replace(/_/g, ' ')}</span>
    )},
    { key: 'date', header: 'Date', accessor: 'date' },
    { key: 'status', header: 'Status', accessor: 'status', render: row => <StatusBadge status={row.status} size="sm" /> },
    { key: 'total', header: 'Total', accessor: 'total', cellClass: 'currency', render: row => row.total > 0 ? `₹${row.total}` : '-' },
    { key: 'payment', header: 'Payment', accessor: 'paymentStatus', render: row => <StatusBadge status={row.paymentStatus || 'unpaid'} size="sm" /> },
  ];

  const statusFilters = ['all', 'pending', 'confirmed', 'working', 'completed', 'cancelled'];

  return (
    <>
      <AdminTopbar title="Bookings" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Booking Management</h1>
            <p>Monitor and manage all service bookings across the platform</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={CalendarCheck} value={bookings.length} label="Total Bookings" variant="primary" />
          <StatCard icon={Clock} value={bookings.filter(b => b.status === 'pending').length} label="Pending" variant="warning" />
          <StatCard icon={CheckCircle2} value={bookings.filter(b => b.status === 'completed').length} label="Completed" variant="success" />
          <StatCard icon={AlertTriangle} value={bookings.filter(b => b.status === 'cancelled').length} label="Cancelled" variant="error" />
        </div>

        <div className="filters-bar">
          {statusFilters.map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search bookings..." emptyMessage="No bookings found." />
      </div>
    </>
  );
}
