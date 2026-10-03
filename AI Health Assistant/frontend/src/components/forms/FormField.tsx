import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { classNames } from '@/utils'

interface FormFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}

const FormField = ({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) => (
  <div className={classNames('form-group', className)}>
    <label htmlFor={htmlFor} className="form-label">
      {label}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
    {children}
    {error ? (
      <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger animate-fade-in">
        <AlertCircle size={13} className="shrink-0" />
        {error}
      </p>
    ) : null}
    {hint && !error ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
  </div>
)

export default FormField
