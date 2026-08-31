import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import './tokens.css';

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'medium' | 'compact';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'medium', loading = false, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={classes('athar-button', `athar-button--${variant}`, `athar-button--${size}`, className)}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="athar-spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
});

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'positive' | 'warning' | 'risk' | 'info';
}

export function StatusBadge({ tone = 'neutral', className, children, ...props }: StatusBadgeProps) {
  return (
    <span className={classes('athar-badge', `athar-badge--${tone}`, className)} {...props}>
      <span className="athar-badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export interface StatePanelProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'positive' | 'warning' | 'risk';
}

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
  className,
  ...props
}: StatePanelProps) {
  const role = tone === 'risk' ? 'alert' : 'status';
  return (
    <section className={classes('athar-state', `athar-state--${tone}`, className)} role={role} {...props}>
      {icon ? <div className="athar-state__icon" aria-hidden="true">{icon}</div> : null}
      <div className="athar-state__copy"><h2>{title}</h2><p>{description}</p></div>
      {action ? <div className="athar-state__action">{action}</div> : null}
    </section>
  );
}

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={classes('athar-field', error && 'athar-field--error')}>
      <label htmlFor={id}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
      {children}
      {hint ? <p id={hintId} className="athar-field__hint">{hint}</p> : null}
      {error ? <p id={errorId} className="athar-field__error" role="alert">{error}</p> : null}
    </div>
  );
}
