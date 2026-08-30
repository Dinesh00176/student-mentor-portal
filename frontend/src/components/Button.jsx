import './Button.css';

export default function Button({ variant = 'primary', size = 'md', as: As = 'button', className = '', ...props }) {
  return <As className={`btn btn--${variant} btn--${size} ${className}`} {...props} />;
}
