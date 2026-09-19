import './TextField.css';

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 3,
  error,
  disabled = false,
  icon: Icon,
  name,
  required = false,
  maxLength,
  className = '',
  ...props
}) {
  const inputProps = {
    className: `textfield__input ${error ? 'textfield__input--error' : ''} ${Icon ? 'textfield__input--icon' : ''}`,
    value,
    onChange: (e) => onChange?.(e.target.value),
    placeholder,
    disabled,
    name,
    required,
    maxLength,
    id: name,
    ...props,
  };

  return (
    <div className={`textfield ${className}`}>
      {label && (
        <label className="textfield__label" htmlFor={name}>
          {label}
          {required && <span className="textfield__required">*</span>}
        </label>
      )}
      <div className="textfield__wrapper">
        {Icon && <Icon size={18} className="textfield__icon" />}
        {multiline ? (
          <textarea {...inputProps} rows={rows} />
        ) : (
          <input type={type} {...inputProps} />
        )}
      </div>
      {error && <span className="textfield__error">{error}</span>}
    </div>
  );
}
