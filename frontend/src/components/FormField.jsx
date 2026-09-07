import './FormField.css';

export function Field({ label, htmlFor, error, hint, required, children, className = '' }) {
  return (
    <div className={`field ${error ? 'field--has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="field__label">
          {label}
          {required && <span className="field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && (
        <span className="field__error" role="alert">
          <svg className="field__error-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

export function Input({ hasError, className = '', ...props }) {
  return <input className={`field__input ${hasError ? 'field__input--error' : ''} ${className}`} {...props} />;
}

export function Select({ options = [], placeholder, hasError, className = '', ...props }) {
  return (
    <div className="field__select-wrap">
      <select className={`field__input field__select ${hasError ? 'field__input--error' : ''} ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <span className="field__select-arrow" aria-hidden="true">▾</span>
    </div>
  );
}

export function TextArea({ hasError, className = '', ...props }) {
  return <textarea className={`field__input field__textarea ${hasError ? 'field__input--error' : ''} ${className}`} {...props} />;
}
