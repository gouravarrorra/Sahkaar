import './StatusBadge.css';

export default function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    active: { label: 'Active', variant: 'success' },
    verified: { label: '✓ Verified', variant: 'success' },
    pending: { label: 'Pending', variant: 'warning' },
    confirmed: { label: 'Confirmed', variant: 'info' },
    on_the_way: { label: 'On The Way', variant: 'info' },
    arrived: { label: 'Arrived', variant: 'info' },
    working: { label: 'Working', variant: 'info' },
    done: { label: 'Done', variant: 'success' },
    completed: { label: 'Completed', variant: 'success' },
    paid: { label: 'Paid', variant: 'success' },
    unpaid: { label: 'Unpaid', variant: 'warning' },
    due: { label: 'Due', variant: 'warning' },
    grace_period: { label: 'Grace Period', variant: 'warning' },
    overdue: { label: 'Overdue', variant: 'error' },
    suspended: { label: 'Suspended', variant: 'error' },
    cancelled: { label: 'Cancelled', variant: 'error' },
    worker_selected: { label: 'Worker Selected', variant: 'info' },
    request_submitted: { label: 'Submitted', variant: 'info' },
    available: { label: 'Available', variant: 'success' },
    unavailable: { label: 'Unavailable', variant: 'error' },
    // Scheme statuses
    draft: { label: 'Draft', variant: 'warning' },
    published: { label: 'Published', variant: 'success' },
    unpublished: { label: 'Unpublished', variant: 'default' },
    expired: { label: 'Expired', variant: 'error' },
    archived: { label: 'Archived', variant: 'default' },
    // Application statuses
    not_applied: { label: 'Not Applied', variant: 'default' },
    application_started: { label: 'Application Started', variant: 'info' },
    documents_pending: { label: 'Documents Pending', variant: 'warning' },
    documents_submitted: { label: 'Documents Submitted', variant: 'info' },
    application_submitted: { label: 'Application Submitted', variant: 'info' },
    under_review: { label: 'Under Review', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
    // Eligibility
    eligible: { label: '✓ Potentially Eligible', variant: 'success' },
    not_eligible: { label: 'Criteria Not Met', variant: 'error' },
    info_needed: { label: 'More Info Required', variant: 'warning' },
    // Pricing Governance
    submitted: { label: 'Submitted', variant: 'info' },
    implemented: { label: 'Implemented', variant: 'success' },
    pending_review: { label: 'Pending Review', variant: 'warning' },
    within_range: { label: 'Within Range', variant: 'success' },
    above_range: { label: 'Above Range', variant: 'error' },
    below_range: { label: 'Below Range', variant: 'warning' },
    price_locked: { label: '🔒 Price Locked', variant: 'info' },
    exception_pending: { label: 'Exception Pending', variant: 'warning' },
    committee_review: { label: 'Committee Review', variant: 'info' },
    flagged: { label: 'Flagged', variant: 'error' },
    dismissed: { label: 'Dismissed', variant: 'default' },
    high: { label: 'High', variant: 'error' },
    medium: { label: 'Medium', variant: 'warning' },
    low: { label: 'Low', variant: 'info' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return (
    <span className={`status-badge status-badge--${config.variant} status-badge--${size}`}>
      {config.label}
    </span>
  );
}
