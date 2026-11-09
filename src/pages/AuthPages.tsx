import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff, Info, LogIn, MailCheck, UserPlus } from 'lucide-react'
import { ApiError, api } from '../lib/api'
import { clearIntent, readIntent, safeReturnTo, type IntentAction } from '../lib/returnTo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { FormError, PageLoader, Spinner } from '../components/ui'
import { PhoneInput } from '../components/PhoneInput'
import { toE164, validateLocal } from '../lib/phone'

function useAuthContextParams() {
  const [sp] = useSearchParams()
  const intent = readIntent()
  const returnTo = safeReturnTo(sp.get('returnTo')) ?? intent?.returnTo ?? null
  const reasonParam = sp.get('reason') as IntentAction | null
  const reason: IntentAction | null = reasonParam ?? (intent ? intent.action : null)
  const carry = new URLSearchParams()
  if (returnTo) carry.set('returnTo', returnTo)
  if (reason) carry.set('reason', reason)
  return { returnTo, reason, carry: carry.toString(), expired: sp.get('expired') === '1' }
}

function AuthCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">{icon}</span>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {children}
      </div>
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex gap-2 rounded-xl bg-accent-soft p-3 text-sm" role="status">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

function PasswordInput({ id, value, onChange, autoComplete, invalid, describedBy }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; invalid?: boolean; describedBy?: string }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className="input pe-12"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center text-muted hover:text-fg"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
      </button>
    </div>
  )
}

function reasonText(reason: IntentAction | null, t: (k: string) => string) {
  if (reason === 'inquiry') return t('auth.reasonInquiry')
  if (reason === 'contact') return t('auth.reasonContact')
  if (reason === 'favorite') return t('auth.reasonFavorite')
  if (reason === 'auth') return t('auth.reasonAuth')
  return null
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const { t } = useTranslation()
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const { returnTo, reason, carry, expired } = useAuthContextParams()
  const registered = (location.state as { registered?: boolean; email?: string } | null) ?? null
  const [email, setEmail] = useState(registered?.email ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const mutation = useMutation({
    mutationFn: () => login(email.trim(), password),
    onSuccess: (user) => {
      const intent = readIntent()
      clearIntent()
      toast(t('auth.welcome', { name: user.fullName }))
      navigate(returnTo ?? intent?.returnTo ?? '/', { replace: true })
    },
  })

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated' && !mutation.isPending && !mutation.isSuccess) return <Navigate to={returnTo ?? '/'} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mutation.isPending) return
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'validation.required'
    else if (!emailRe.test(email.trim())) next.email = 'validation.email'
    if (!password) next.password = 'validation.required'
    setErrors(next)
    if (Object.keys(next).length === 0) mutation.mutate()
  }

  const invalidCreds = mutation.error instanceof ApiError && mutation.error.status === 401
  const notice = expired ? t('auth.sessionExpired') : registered?.registered ? t('auth.registered') : reasonText(reason, t)

  return (
    <AuthCard title={t('auth.loginTitle')} icon={<LogIn className="size-6" aria-hidden />}>
      {notice && <Notice>{notice}</Notice>}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="label">
            {t('fields.email')}
          </label>
          <input id="login-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'login-email-err' : undefined} />
          {errors.email && (
            <p id="login-email-err" className="field-error">
              {t(errors.email)}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="login-password" className="label">
            {t('fields.password')}
          </label>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" invalid={!!errors.password} describedBy={errors.password ? 'login-pass-err' : undefined} />
          {errors.password && (
            <p id="login-pass-err" className="field-error">
              {t(errors.password)}
            </p>
          )}
        </div>
        {invalidCreds ? (
          <p className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger" role="alert">
            {t('auth.invalidCredentials')}
          </p>
        ) : (
          <FormError error={mutation.error} />
        )}
        <button type="submit" className="btn-primary w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Spinner className="size-4" />}
          {t('auth.loginSubmit')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.noAccount')}{' '}
        <Link to={`/register${carry ? `?${carry}` : ''}`} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
          {t('auth.registerLink')}
        </Link>
      </p>
    </AuthCard>
  )
}

function verifyErrorKey(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null
  const m = error.messages[0] ?? ''
  if (m === 'Invalid code') return 'verify.invalid'
  if (m.startsWith('Code expired')) return 'verify.expired'
  if (m.startsWith('Too many attempts')) return 'verify.tooMany'
  if (m.startsWith('Code not found')) return 'verify.notFound'
  if (m === 'Email is not verified') return 'verify.notVerified'
  return null
}

export function RegisterPage() {
  const { t } = useTranslation()
  const { status, login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const { returnTo, reason, carry } = useAuthContextParams()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limitHours, setLimitHours] = useState<number | null>(null)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (step !== 'code') return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [step])
  const secondsLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const sendCode = useMutation({
    mutationFn: () => api.auth.sendCode(form.email.trim()),
    onSuccess: (res) => {
      setResendAt(Date.now() + res.resendAfterSeconds * 1000)
      setNow(Date.now())
      setRemaining(res.remainingSends)
      setLimitHours(null)
      setCode('')
      setCodeError(null)
      if (step === 'code') toast(t('verify.resent'))
      setStep('code')
    },
    onError: (err) => {
      if (!(err instanceof ApiError) || err.status !== 429) return
      const wait = err.retryAfterSeconds ?? 60
      if (err.messages[0] === 'Daily code limit reached') {
        setLimitHours(Math.max(1, Math.ceil(wait / 3600)))
        setRemaining(0)
        return
      }
      setResendAt(Date.now() + wait * 1000)
      setNow(Date.now())
      setStep('code')
    },
  })
  const isRateLimit = (err: unknown) => err instanceof ApiError && err.status === 429

  const finish = useMutation({
    mutationFn: async () => {
      const email = form.email.trim()
      await api.auth.verifyCode(email, code)
      await api.auth.register({
        fullName: form.fullName.trim(),
        email,
        password: form.password,
        phone: toE164(phone),
      })
      return login(email, form.password)
    },
    onSuccess: (user) => {
      const intent = readIntent()
      clearIntent()
      toast(t('auth.welcome', { name: user.fullName }))
      navigate(returnTo ?? intent?.returnTo ?? '/', { replace: true })
    },
  })

  if (status === 'loading') return <PageLoader />
  if (status === 'authenticated' && !finish.isPending && !finish.isSuccess) return <Navigate to={returnTo ?? '/'} replace />

  const submitForm = (e: FormEvent) => {
    e.preventDefault()
    if (sendCode.isPending) return
    const next: Record<string, string> = {}
    if (!form.fullName.trim()) next.fullName = 'validation.required'
    if (!form.email.trim()) next.email = 'validation.required'
    else if (!emailRe.test(form.email.trim())) next.email = 'validation.email'
    const phoneError = phone ? validateLocal(phone) : 'validation.required'
    if (phoneError) next.phone = phoneError
    if (form.password.length < 6) next.password = 'validation.passwordMin'
    if (form.confirm !== form.password) next.confirm = 'validation.passwordMatch'
    setErrors(next)
    if (Object.keys(next).length === 0) sendCode.mutate()
  }

  const submitCode = (e: FormEvent) => {
    e.preventDefault()
    if (finish.isPending) return
    if (!/^\d{6}$/.test(code)) return setCodeError('verify.codeFormat')
    setCodeError(null)
    finish.mutate()
  }

  const notice = reasonText(reason, t)
  const errorBox = (text: string) => (
    <p className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger" role="alert">
      {text}
    </p>
  )

  if (step === 'code') {
    const verifyKey = verifyErrorKey(finish.error)
    const conflict = finish.error instanceof ApiError && finish.error.status === 409
    const resendError = sendCode.error && !isRateLimit(sendCode.error) ? sendCode.error : null
    return (
      <AuthCard title={t('verify.title')} icon={<MailCheck className="size-6" aria-hidden />}>
        <p className="mt-3 text-sm text-muted">
          {t('verify.sentTo')} <span className="font-semibold break-all text-fg">{form.email.trim()}</span>
        </p>
        <p className="mt-1 text-xs text-muted">{t('verify.spamHint')}</p>
        <form onSubmit={submitCode} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="reg-code" className="label">
              {t('verify.code')}
            </label>
            <input
              id="reg-code"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className="input text-center font-mono text-2xl tracking-[0.5em]"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              aria-invalid={!!codeError || !!verifyKey}
              aria-describedby={codeError ? 'reg-code-err' : undefined}
            />
            {codeError && (
              <p id="reg-code-err" className="field-error">
                {t(codeError)}
              </p>
            )}
          </div>
          {verifyKey ? errorBox(t(verifyKey)) : conflict ? errorBox(t('auth.emailTaken')) : <FormError error={finish.error ?? resendError} />}
          {limitHours !== null && errorBox(t('verify.dailyLimit', { limit: 5, hours: limitHours }))}
          <button type="submit" className="btn-primary w-full" disabled={finish.isPending}>
            {finish.isPending && <Spinner className="size-4" />}
            {t('verify.submit')}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn-ghost -ms-3" onClick={() => setStep('form')}>
            <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
            {t('verify.changeEmail')}
          </button>
          {secondsLeft > 0 ? (
            <span className="text-sm text-muted" aria-live="polite">
              {t('verify.resendIn', { s: secondsLeft })}
            </span>
          ) : remaining !== 0 && limitHours === null ? (
            <button type="button" className="btn-ghost -me-3 text-accent" disabled={sendCode.isPending} onClick={() => sendCode.mutate()}>
              {sendCode.isPending && <Spinner className="size-4" />}
              {t('verify.resend')}
            </button>
          ) : null}
        </div>
        {remaining !== null && (
          <p className="mt-2 text-xs text-muted">{t('verify.remaining', { count: remaining, limit: 5 })}</p>
        )}
      </AuthCard>
    )
  }

  const conflict = sendCode.error instanceof ApiError && sendCode.error.status === 409
  const field = (key: string, label: string, input: ReactNode, optional = false) => (
    <div>
      <label htmlFor={`reg-${key}`} className="label">
        {label} {optional && <span className="font-normal text-muted">({t('common.optional')})</span>}
      </label>
      {input}
      {errors[key] && (
        <p id={`reg-${key}-err`} className="field-error">
          {t(errors[key], { min: 6 })}
        </p>
      )}
    </div>
  )
  const aria = (key: string) => ({ 'aria-invalid': !!errors[key], 'aria-describedby': errors[key] ? `reg-${key}-err` : undefined })

  return (
    <AuthCard title={t('auth.registerTitle')} icon={<UserPlus className="size-6" aria-hidden />}>
      {notice && <Notice>{notice}</Notice>}
      <form onSubmit={submitForm} className="mt-6 space-y-4" noValidate>
        {field('fullName', t('fields.fullName'), <input id="reg-fullName" className="input" value={form.fullName} onChange={set('fullName')} autoComplete="name" {...aria('fullName')} />)}
        {field('email', t('fields.email'), <input id="reg-email" type="email" className="input" value={form.email} onChange={set('email')} autoComplete="email" {...aria('email')} />)}
        {field(
          'phone',
          t('fields.phone'),
          <PhoneInput
            id="reg-phone"
            value={phone}
            onChange={(digits) => {
              setPhone(digits)
              if (errors.phone) setErrors((e) => ({ ...e, phone: validateLocal(digits) ?? '' }))
            }}
            invalid={!!errors.phone}
            describedBy={errors.phone ? 'reg-phone-err' : undefined}
          />,
        )}
        {field('password', t('fields.password'), <PasswordInput id="reg-password" value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" invalid={!!errors.password} describedBy={errors.password ? 'reg-password-err' : 'reg-password-hint'} />)}
        {!errors.password && (
          <p id="reg-password-hint" className="-mt-2 text-xs text-muted">
            {t('validation.passwordMin', { min: 6 })}
          </p>
        )}
        {field('confirm', t('fields.confirmPassword'), <PasswordInput id="reg-confirm" value={form.confirm} onChange={(v) => setForm((f) => ({ ...f, confirm: v }))} autoComplete="new-password" invalid={!!errors.confirm} describedBy={errors.confirm ? 'reg-confirm-err' : undefined} />)}
        {conflict ? errorBox(t('auth.emailTaken')) : <FormError error={isRateLimit(sendCode.error) ? null : sendCode.error} />}
        {limitHours !== null && errorBox(t('verify.dailyLimit', { limit: 5, hours: limitHours }))}
        <p className="text-xs text-muted">{t('verify.formHint')}</p>
        <button type="submit" className="btn-primary w-full" disabled={sendCode.isPending}>
          {sendCode.isPending && <Spinner className="size-4" />}
          {t('verify.sendCode')}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        {t('auth.haveAccount')}{' '}
        <Link to={`/login${carry ? `?${carry}` : ''}`} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
          {t('auth.loginLink')}
        </Link>
      </p>
    </AuthCard>
  )
}
