import './Button.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  as: As = 'button',
  loading = false,
  disabled = false,
  icon = null,
  fullWidth = false,
  children,
  className = '',
  ...props
}) {
  return (
    <As
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${fullWidth ? 'btn--full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn__icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span className="btn__text">{children}</span>
    </As>
  );
}
