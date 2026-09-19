import { HeartHandshake, IndianRupee, Users, TrendingUp } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';

const fundAllocations = [
  { category: 'Health Benefits', allocated: 45000, disbursed: 32000, beneficiaries: 28 },
  { category: 'Education Support', allocated: 25000, disbursed: 18500, beneficiaries: 12 },
  { category: 'Emergency Fund', allocated: 30000, disbursed: 8000, beneficiaries: 5 },
  { category: 'Festival Bonuses', allocated: 20000, disbursed: 20000, beneficiaries: 47 },
  { category: 'Retirement Savings', allocated: 15000, disbursed: 15000, beneficiaries: 35 },
];

export default function Welfare() {
  const totalAllocated = fundAllocations.reduce((s, f) => s + f.allocated, 0);
  const totalDisbursed = fundAllocations.reduce((s, f) => s + f.disbursed, 0);

  return (
    <>
      <AdminTopbar title="Welfare" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Worker Welfare</h1>
            <p>Fund allocation, benefit disbursement, and worker contribution tracking</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={IndianRupee} value={`₹${(totalAllocated / 1000).toFixed(0)}K`} label="Total Allocated" variant="primary" />
          <StatCard icon={HeartHandshake} value={`₹${(totalDisbursed / 1000).toFixed(0)}K`} label="Disbursed" variant="success" />
          <StatCard icon={Users} value="47" label="Beneficiaries" variant="info" />
          <StatCard icon={TrendingUp} value={`${Math.round((totalDisbursed / totalAllocated) * 100)}%`} label="Utilization" variant="warning" />
        </div>

        <div className="admin-section">
          <h3 className="admin-section__title">Fund Allocations</h3>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Allocated</th>
                  <th style={{ textAlign: 'right' }}>Disbursed</th>
                  <th>Utilization</th>
                  <th style={{ textAlign: 'right' }}>Beneficiaries</th>
                </tr>
              </thead>
              <tbody>
                {fundAllocations.map(f => {
                  const pct = Math.round((f.disbursed / f.allocated) * 100);
                  return (
                    <tr key={f.category}>
                      <td className="font-medium">{f.category}</td>
                      <td className="currency">₹{f.allocated.toLocaleString()}</td>
                      <td className="currency">₹{f.disbursed.toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div className={`progress-bar__fill ${pct === 100 ? 'progress-bar__fill--success' : ''}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="currency">{f.beneficiaries}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </>
  );
}
