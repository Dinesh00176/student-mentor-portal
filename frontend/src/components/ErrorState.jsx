import Button from './Button';
import './States.css';

export default function ErrorState({
  title = 'Unable to load content',
  message = 'Something went wrong. Please check your connection and try again.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`state-block state-block--error ${className}`} role="alert">
      <div className="state-block__icon state-block__icon--error" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h4 className="state-block__title">{title}</h4>
      <p className="state-block__desc">{message}</p>
      {onRetry && (
        <div className="state-block__action">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
