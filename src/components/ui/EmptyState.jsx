import './EmptyState.css';

export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state__icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"/>
          <line x1="16" y1="20" x2="32" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16" y1="32" x2="24" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
