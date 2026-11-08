import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Home, SearchX, ShieldAlert } from 'lucide-react'

function StatusPage({ code, title, text, icon }: { code: string; title: string; text: string; icon: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">{icon}</span>
      <p className="text-5xl font-extrabold text-accent">{code}</p>
      <h1 className="mt-3 text-2xl font-bold">{title}</h1>
      <p className="mt-2 max-w-md text-muted">{text}</p>
      <Link to="/" className="btn-primary mt-6">
        <Home className="size-4" aria-hidden />
        {t('nav.home')}
      </Link>
    </div>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()
  return <StatusPage code="404" title={t('status404.title')} text={t('status404.text')} icon={<SearchX className="size-8" aria-hidden />} />
}

export function ForbiddenPage() {
  const { t } = useTranslation()
  return <StatusPage code="403" title={t('status403.title')} text={t('status403.text')} icon={<ShieldAlert className="size-8" aria-hidden />} />
}
