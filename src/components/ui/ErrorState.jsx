import { AlertCircle } from 'lucide-react';
import Button from './Button';
import './ErrorState.css';

export default function ErrorState({ title, description, onRetry }) {
  return (
    <div className="error-state animate-fade-in">
      <AlertCircle size={40} className="error-state__icon" />
      <h3 className="error-state__title">{title || 'Something went wrong.'}</h3>
      <p className="error-state__desc">{description || 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} size="sm">
          Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ message }) {
  return (
    <div className="loading-state">
      <div className="spinner spinner--lg" />
      {message && <p className="loading-state__msg">{message}</p>}
    </div>
  );
}
