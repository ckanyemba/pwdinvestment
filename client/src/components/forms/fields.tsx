import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/format';

type Common = { label: string; error?: string; hint?: string; className?: string };

function Wrap({ label, error, hint, className, children, id, required }: Common & { children: ReactNode; id: string; required?: boolean }) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-navy">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, className, name, ...props }: Common & InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  const id = props.id || name;
  return (
    <Wrap {...{ label, error, hint, className, id, required: props.required }}>
      <input id={id} name={name} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="input" {...props} />
    </Wrap>
  );
}

export function TextArea({ label, error, hint, className, name, ...props }: Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string }) {
  const id = props.id || name;
  return (
    <Wrap {...{ label, error, hint, className, id, required: props.required }}>
      <textarea id={id} name={name} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="input min-h-32" {...props} />
    </Wrap>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  name,
  options,
  placeholder = 'Select…',
  ...props
}: Common & SelectHTMLAttributes<HTMLSelectElement> & { name: string; options: (string | { value: string; label: string })[]; placeholder?: string }) {
  const id = props.id || name;
  return (
    <Wrap {...{ label, error, hint, className, id, required: props.required }}>
      <select id={id} name={name} aria-invalid={!!error} className="input" defaultValue="" {...props}>
        <option value="">{placeholder}</option>
        {options.map((o) => {
          const { value, label: l } = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={value} value={value}>
              {l}
            </option>
          );
        })}
      </select>
    </Wrap>
  );
}

export function RadioGroup({ label, name, options, defaultValue, className }: { label: string; name: string; options: string[]; defaultValue?: string; className?: string }) {
  return (
    <fieldset className={cx('flex flex-col gap-1.5', className)}>
      <legend className="mb-1.5 text-sm font-semibold text-navy">{label}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm">
            <input type="radio" name={name} value={o} defaultChecked={o === defaultValue} className="accent-green" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Hidden honeypot input; bots fill it, the API rejects non-empty values. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormStatus({ status, error }: { status: 'idle' | 'sending' | 'sent' | 'error'; error?: string }) {
  if (status === 'error') return <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error || 'Something went wrong. Please try again.'}</p>;
  return null;
}
