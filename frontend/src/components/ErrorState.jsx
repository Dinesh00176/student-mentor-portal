import './States.css';

export default function ErrorState({ message = 'Something went wrong. Please try again.', onRetry }) {
  return (
    <div className="state-block state-block--error" role="alert">
      <p className="state-block__title">Unable to load this content</p>
      <p className="state-block__desc">{message}</p>
      {onRetry && (
        <button type="button" className="state-block__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
