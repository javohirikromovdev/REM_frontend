import { UZ_PREFIX, formatLocal, toLocalDigits } from '../lib/phone'

interface Props {
  id: string
  value: string
  onChange: (digits: string) => void
  invalid?: boolean
  describedBy?: string
}

export function PhoneInput({ id, value, onChange, invalid, describedBy }: Props) {
  return (
    <div
      className={`flex min-h-11 items-center rounded-xl border bg-surface focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${
        invalid ? 'border-danger' : 'border-line'
      }`}
    >
      <span className="select-none ps-3 pe-1 text-sm font-semibold text-fg" aria-hidden>
        {UZ_PREFIX}
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        className="min-h-11 w-full min-w-0 rounded-e-xl bg-transparent pe-3 text-sm text-fg placeholder:text-muted focus:outline-none"
        value={formatLocal(value)}
        onChange={(e) => onChange(toLocalDigits(e.target.value))}
        placeholder="90 123 45 67"
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
    </div>
  )
}
