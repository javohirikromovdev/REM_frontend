import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Building2, Heart, Home, User } from 'lucide-react'
import { Navbar, Logo } from './Navbar'
import { useCategories } from '../hooks/queries'
import { categoryName } from '../lib/format'

function BottomNav() {
  const { t } = useTranslation()
  const items = [
    { to: '/', label: t('nav.home'), icon: Home, end: true },
    { to: '/properties', label: t('nav.listings'), icon: Building2, end: false },
    { to: '/favorites', label: t('nav.favorites'), icon: Heart, end: false },
    { to: '/cabinet', label: t('nav.cabinet'), icon: User, end: false },
  ]
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label={t('nav.bottom')}
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium leading-tight ${isActive ? 'text-accent' : 'text-muted'}`
              }
            >
              <Icon className="size-5" aria-hidden />
              <span className="line-clamp-1 max-w-full text-center">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Footer() {
  const { t } = useTranslation()
  const { data: categories } = useCategories()
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">{t('footer.about')}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t('nav.sections')}</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {(categories ?? []).map((c) => (
              <li key={c.id}>
                <Link to={`/properties?category=${encodeURIComponent(c.slug)}`} className="inline-flex min-h-11 items-center hover:text-accent">
                  {categoryName(c)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t('footer.links')}</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <li>
              <Link to="/properties?type=SALE" className="inline-flex min-h-11 items-center hover:text-accent">
                {t('hero.buy')}
              </Link>
            </li>
            <li>
              <Link to="/properties?type=RENT" className="inline-flex min-h-11 items-center hover:text-accent">
                {t('hero.rent')}
              </Link>
            </li>
            <li>
              <Link to="/cabinet/properties/new" className="inline-flex min-h-11 items-center hover:text-accent">
                {t('nav.postAd')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} REM — {t('footer.rights')}
      </div>
    </footer>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  // Yangi sahifaga o'tganda tepaga qaytish (query o'zgarishida emas)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">
        {t('nav.skip')}
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
