import { useState } from 'react';
import { serviceCategories, serviceSubTypes } from '../../data/mockData';
import { Briefcase, ToggleLeft, ToggleRight, Edit3, Settings } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Services() {
  const [expanded, setExpanded] = useState(null);

  return (
    <>
      <AdminTopbar title="Services" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Service Catalog</h1>
            <p>Manage service categories, sub-types, and availability</p>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={Briefcase} value={serviceCategories.length} label="Categories" variant="primary" />
          <StatCard icon={Settings} value={Object.values(serviceSubTypes).flat().length} label="Sub-Types" variant="info" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {serviceCategories.map(cat => (
            <Card key={cat.id} style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="stat-card__icon stat-card__icon--primary" style={{ width: 32, height: 32 }}>
                    <Briefcase size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm" style={{ textTransform: 'capitalize' }}>{cat.id.replace(/_/g, ' ')}</span>
                    <p className="text-xs text-secondary">{serviceSubTypes[cat.id]?.length || 0} sub-types</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <ToggleRight size={24} style={{ color: 'var(--color-success)' }} />
                  <button className="action-btn"><Edit3 size={14} /></button>
                </div>
              </div>

              {expanded === cat.id && serviceSubTypes[cat.id] && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
                  {serviceSubTypes[cat.id].map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', fontSize: '0.82rem' }}>
                      <span>{sub.name}</span>
                      <ToggleRight size={18} style={{ color: 'var(--color-success)' }} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
