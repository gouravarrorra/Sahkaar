import { useState } from 'react';
import { GraduationCap, Users, Clock, CheckCircle2, Plus, Calendar } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const programs = [
  { id: 'TRN-001', title: 'Electrical Safety Standards', category: 'Safety', duration: '3 days', enrolled: 18, capacity: 25, startDate: '2024-10-01', status: 'upcoming', instructor: 'Mr. Verma' },
  { id: 'TRN-002', title: 'Advanced Plumbing Techniques', category: 'Skill Upgrade', duration: '5 days', enrolled: 12, capacity: 15, startDate: '2024-09-20', status: 'in_progress', instructor: 'Mr. Gupta' },
  { id: 'TRN-003', title: 'Customer Communication Skills', category: 'Soft Skills', duration: '1 day', enrolled: 30, capacity: 30, startDate: '2024-09-10', status: 'completed', instructor: 'Ms. Sharma' },
  { id: 'TRN-004', title: 'Digital Payments & UPI Workshop', category: 'Technology', duration: '2 days', enrolled: 22, capacity: 40, startDate: '2024-11-05', status: 'upcoming', instructor: 'Mr. Patel' },
  { id: 'TRN-005', title: 'Workplace First Aid', category: 'Safety', duration: '1 day', enrolled: 15, capacity: 20, startDate: '2024-08-15', status: 'completed', instructor: 'Dr. Joshi' },
];

export default function TrainingPrograms() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? programs : programs.filter(p => p.status === filter);

  const columns = [
    { key: 'id', header: 'ID', accessor: 'id' },
    { key: 'title', header: 'Program', accessor: 'title', render: row => (
      <div>
        <span className="font-medium">{row.title}</span>
        <p className="text-xs text-secondary">{row.category} • {row.duration}</p>
      </div>
    )},
    { key: 'instructor', header: 'Instructor', accessor: 'instructor' },
    { key: 'enrolled', header: 'Enrolled', accessor: 'enrolled', render: row => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <div className="progress-bar" style={{ width: 60 }}>
          <div className={`progress-bar__fill ${row.enrolled >= row.capacity ? 'progress-bar__fill--success' : ''}`}
            style={{ width: `${(row.enrolled / row.capacity) * 100}%` }} />
        </div>
        <span className="text-xs">{row.enrolled}/{row.capacity}</span>
      </div>
    )},
    { key: 'startDate', header: 'Start Date', accessor: 'startDate' },
    { key: 'status', header: 'Status', accessor: 'status', render: row => (
      <StatusBadge status={row.status === 'in_progress' ? 'working' : row.status === 'upcoming' ? 'pending' : row.status} size="sm" />
    )},
    { key: 'actions', header: '', sortable: false, render: () => <Button size="sm" variant="ghost">Manage</Button> },
  ];

  return (
    <>
      <AdminTopbar title="Training Programs" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Training Programs</h1>
            <p>Create programs, track enrollment, and issue completion certificates</p>
          </div>
          <div className="admin-page-header__actions">
            <Button icon={Plus}>Create Program</Button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={GraduationCap} value={programs.length} label="Total Programs" variant="primary" />
          <StatCard icon={Clock} value={programs.filter(p => p.status === 'in_progress').length} label="In Progress" variant="info" />
          <StatCard icon={Calendar} value={programs.filter(p => p.status === 'upcoming').length} label="Upcoming" variant="warning" />
          <StatCard icon={Users} value={programs.reduce((s, p) => s + p.enrolled, 0)} label="Total Enrolled" variant="success" />
        </div>

        <div className="filters-bar">
          {['all', 'upcoming', 'in_progress', 'completed'].map(f => (
            <button key={f} className={`filter-chip ${filter === f ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <DataTable columns={columns} data={filtered} searchable searchPlaceholder="Search programs..." />
      </div>
    </>
  );
}
