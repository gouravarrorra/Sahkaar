import { useState } from 'react';
import { MapPin, IndianRupee, Settings, Save } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import StatCard from '../components/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';

const defaultRules = [
  { id: 1, label: 'Base rate per km', value: '8', unit: '₹/km' },
  { id: 2, label: 'Minimum travel charge', value: '30', unit: '₹' },
  { id: 3, label: 'Maximum travel charge', value: '500', unit: '₹' },
  { id: 4, label: 'Free distance (no charge)', value: '2', unit: 'km' },
  { id: 5, label: 'Peak hour multiplier', value: '1.25', unit: '×' },
];

const zones = [
  { id: 'urban', label: 'Urban', rateMultiplier: '1.0', maxDist: '25 km' },
  { id: 'suburban', label: 'Suburban', rateMultiplier: '1.15', maxDist: '40 km' },
  { id: 'rural', label: 'Rural', rateMultiplier: '1.3', maxDist: '60 km' },
];

export default function TravelCost() {
  const [rules, setRules] = useState(defaultRules);

  const updateRule = (id, newValue) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, value: newValue } : r));
  };

  return (
    <>
      <AdminTopbar title="Travel Cost" />
      <div className="admin-content__body animate-fade-in">
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>Travel Cost Rules</h1>
            <p>Configure per-km rates, distance slabs, maximum caps, and zone settings</p>
          </div>
          <div className="admin-page-header__actions">
            <Button icon={Save}>Save Changes</Button>
          </div>
        </div>

        <div className="stats-grid">
          <StatCard icon={IndianRupee} value="₹8" label="Per KM Rate" variant="primary" />
          <StatCard icon={MapPin} value="3" label="Zones" variant="info" />
          <StatCard icon={Settings} value="₹500" label="Max Cap" variant="warning" />
        </div>

        {/* Rules */}
        <div className="admin-section">
          <h3 className="admin-section__title"><Settings size={16} /> Base Rules</h3>
          <Card>
            {rules.map(rule => (
              <div key={rule.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm font-medium">{rule.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <input
                    type="number" value={rule.value}
                    onChange={e => updateRule(rule.id, e.target.value)}
                    style={{ width: 80, padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'right', fontFamily: 'inherit', fontSize: '0.85rem' }}
                  />
                  <span className="text-xs text-secondary" style={{ width: 40 }}>{rule.unit}</span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Zones */}
        <div className="admin-section">
          <h3 className="admin-section__title"><MapPin size={16} /> Zone Configuration</h3>
          <div className="info-card-grid">
            {zones.map(zone => (
              <Card key={zone.id} className="info-card">
                <div className="info-card__header">
                  <span className="info-card__title">{zone.label}</span>
                  <button className="action-btn"><Settings size={14} /></button>
                </div>
                <div style={{ fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span className="text-secondary">Rate Multiplier</span>
                    <span className="font-semibold">{zone.rateMultiplier}×</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Max Distance</span>
                    <span className="font-semibold">{zone.maxDist}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
