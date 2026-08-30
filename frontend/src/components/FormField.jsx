import './FormField.css';

export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor} className="field__label">
          {label}{required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <span className="field__hint">{hint}</span>}
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  );
}

export function Input(props) {
  return <input className="field__input" {...props} />;
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select className="field__input" {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function TextArea(props) {
  return <textarea className="field__input field__textarea" {...props} />;
}
