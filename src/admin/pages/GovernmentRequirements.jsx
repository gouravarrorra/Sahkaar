import { FileCheck, AlertTriangle, CheckCircle2, Calendar, Clock } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';

const requirements = [
  { id: 'REQ-001', title: 'Minimum Wages Act Compliance', category: 'Labor Law', deadline: '2024-12-31', status: 'compliant', priority: 'high', description: 'Ensure all worker payments meet state minimum wage requirements.' },
  { id: 'REQ-002', title: 'EPF Registration & Remittance', category: 'Social Security', deadline: '2024-10-15', status: 'action_needed', priority: 'high', description: 'Monthly PF contributions for all eligible workers.' },
  { id: 'REQ-003', title: 'ESIC Coverage Verification', category: 'Insurance', deadline: '2024-11-30', status: 'compliant', priority: 'medium', description: 'Verify ESIC enrollment for workers earning below threshold.' },
  { id: 'REQ-004', title: 'Annual Return Filing (Form V)', category: 'Reporting', deadline: '2025-01-31', status: 'upcoming', priority: 'medium', description: 'File annual return under Contract Labour Act.' },
  { id: 'REQ-005', title: 'Workplace Safety Audit', category: 'Safety', deadline: '2024-10-01', status: 'overdue', priority: 'high', description: 'Quarterly safety audit for all registered service locations.' },
  { id: 'REQ-006', title: 'GST Quarterly Filing', category: 'Tax', deadline: '2024-10-20', status: 'action_needed', priority: 'high', description: 'GSTR-3B filing for current quarter.' },
];

const statusColors = { compliant: 'active', action_needed: 'warning', upcoming: 'pending', overdue: 'error' };

export default function GovernmentRequirements() {
  return (
    <>
      <AdminTopbar title="Requirements" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Government Requirements</h1>
            <p>Regulatory compliance tracking, labor law checklists, and reporting deadlines</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={CheckCircle2} value={requirements.filter(r => r.status === 'compliant').length} label="Compliant" variant="success" />
          <StatCard icon={AlertTriangle} value={requirements.filter(r => r.status === 'action_needed').length} label="Action Needed" variant="warning" />
          <StatCard icon={Clock} value={requirements.filter(r => r.status === 'overdue').length} label="Overdue" variant="error" />
          <StatCard icon={Calendar} value={requirements.filter(r => r.status === 'upcoming').length} label="Upcoming" variant="info" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {requirements.map(req => (
            <Card key={req.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                    <span className="font-semibold text-sm">{req.title}</span>
                    <StatusBadge status={statusColors[req.status]} size="sm" />
                  </div>
                  <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-2)' }}>{req.description}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    <span>📂 {req.category}</span>
                    <span>📅 Deadline: {req.deadline}</span>
                    <span>⚡ Priority: {req.priority}</span>
                  </div>
                </div>
                <div>
                  {(req.status === 'action_needed' || req.status === 'overdue') && (
                    <button className="action-btn" style={{ padding: 'var(--space-1) var(--space-3)', background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600 }}>
                      Take Action
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
