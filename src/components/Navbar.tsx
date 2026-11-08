import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  ChevronDown,
  FileText,
  Heart,
  Home,
  LayoutGrid,
  Languages,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Monitor,
  Moon,
  Plus,
  Shield,
  Sun,
  User,
  UserPlus,
} from 'lucide-react'
import { LOCALES } from '../i18n'
import { useTheme, type ThemePreference } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/queries'
import { categoryName } from '../lib/format'
import { Dropdown, type DropdownItem } from './Dropdown'
import { Drawer } from './Modal'

export function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2 rounded-lg" aria-label="REM">
      <svg viewBox="0 0 40 28" className="h-7 w-10 text-accent" aria-hidden>
        <path d="M3 17 20 4l17 13" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M27 6h5v6" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight text-fg">REM</span>
    </Link>
  )
}

function ThemeSwitcher() {
  const { t } = useTranslation()
  const { preference, setPreference } = useTheme()
  const icons = { system: Monitor, light: Sun, dark: Moon }
  const Icon = icons[preference]
  const items: DropdownItem[] = (['system', 'light', 'dark'] as ThemePreference[]).map((p) => {
    const I = icons[p]
    return { key: p, label: t(`theme.${p}`), icon: <I className="size-4" />, checked: preference === p, onSelect: () => setPreference(p) }
  })
  return (
    <Dropdown
      ariaLabel={t('theme.label')}
      buttonClassName="icon-btn"
      button={<Icon className="size-5" aria-hidden />}
      items={items}
      menuClassName="w-44"
    />
  )
}

function LocaleSwitcher() {
  const { t, i18n } = useTranslation()
  const current = LOCALES.find((l) => l.code === i18n.language) ?? LOCALES[0]
  return (
    <Dropdown
      ariaLabel={t('locale.label')}
      buttonClassName="btn-ghost px-2.5"
      button={
        <>
          <Languages className="size-5" aria-hidden />
          <span className="text-xs font-bold">{current.short}</span>
        </>
      }
      items={LOCALES.map((l) => ({
        key: l.code,
        label: (
          <span lang={l.code}>{l.label}</span>
        ),
        checked: l.code === i18n.language,
        onSelect: () => void i18n.changeLanguage(l.code),
      }))}
      menuClassName="w-48"
    />
  )
}

function useUserMenu(): DropdownItem[] {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const items: DropdownItem[] = [
    { key: 'profile', label: t('nav.profile'), icon: <User className="size-4" />, to: '/cabinet' },
    { key: 'my', label: t('nav.myListings'), icon: <FileText className="size-4" />, to: '/cabinet/properties' },
    { key: 'fav', label: t('nav.favorites'), icon: <Heart className="size-4" />, to: '/favorites' },
    { key: 'inq', label: t('nav.myInquiries'), icon: <MessageSquare className="size-4" />, to: '/cabinet/inquiries' },
  ]
  if (user?.role === 'ADMIN') items.push({ key: 'admin', label: t('nav.admin'), icon: <Shield className="size-4" />, to: '/admin' })
  items.push({ key: 'logout', label: t('nav.logout'), icon: <LogOut className="size-4" />, onSelect: logout, danger: true })
  return items
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
    isActive ? 'text-accent after:absolute after:inset-x-3 after:-bottom-[13px] after:h-0.5 after:rounded after:bg-accent' : 'text-fg hover:bg-surface-2'
  }`

export function Navbar() {
  const { t } = useTranslation()
  const { user, status } = useAuth()
  const { data: categories } = useCategories()
  const userMenu = useUserMenu()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const loginUrl = `/login?${new URLSearchParams({ returnTo: location.pathname + location.search })}`

  const categoryItems: DropdownItem[] = [
    { key: 'all', label: t('nav.allListings'), icon: <LayoutGrid className="size-4" />, to: '/properties' },
    ...(categories ?? []).map((c) => ({ key: c.slug, label: categoryName(c), to: `/properties?category=${encodeURIComponent(c.slug)}` })),
  ]

  const drawerLink = 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium hover:bg-surface-2'
  const close = () => setDrawerOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2">
        <Logo />

        <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label={t('nav.main')}>
          <NavLink to="/" end className={navLinkClass}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/properties" className={navLinkClass}>
            {t('nav.listings')}
          </NavLink>
          <Dropdown
            ariaLabel={t('nav.sections')}
            align="start"
            buttonClassName="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold hover:bg-surface-2"
            button={
              <>
                {t('nav.sections')}
                <ChevronDown className="size-4" aria-hidden />
              </>
            }
            items={categoryItems}
          />
          <NavLink to="/favorites" className={navLinkClass}>
            <Heart className="size-4" aria-hidden />
            {t('nav.favorites')}
          </NavLink>
        </nav>

        <div className="ms-auto flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />

          <div className="hidden items-center gap-2 lg:flex">
            {status === 'authenticated' && user ? (
              <Dropdown
                ariaLabel={t('nav.profileMenu')}
                buttonClassName="btn-outline max-w-52"
                button={
                  <>
                    <User className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{user.fullName}</span>
                    <ChevronDown className="size-4 shrink-0" aria-hidden />
                  </>
                }
                items={userMenu}
              />
            ) : (
              <Link to={loginUrl} className="btn-outline">
                <LogIn className="size-4" aria-hidden />
                {t('nav.login')}
              </Link>
            )}
            <Link to="/cabinet/properties/new" className="btn-primary">
              <Plus className="size-4" aria-hidden />
              {t('nav.postAd')}
            </Link>
          </div>

          <button type="button" className="icon-btn lg:hidden" onClick={() => setDrawerOpen(true)} aria-label={t('nav.openMenu')} aria-expanded={drawerOpen}>
            <Menu className="size-6" aria-hidden />
          </button>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={close} title={t('nav.menu')}>
        <nav className="flex flex-col gap-1" aria-label={t('nav.main')}>
          <Link to="/" className={drawerLink} onClick={close}>
            <Home className="size-5 text-muted" aria-hidden />
            {t('nav.home')}
          </Link>
          <Link to="/properties" className={drawerLink} onClick={close}>
            <Building2 className="size-5 text-muted" aria-hidden />
            {t('nav.listings')}
          </Link>
          <Link to="/favorites" className={drawerLink} onClick={close}>
            <Heart className="size-5 text-muted" aria-hidden />
            {t('nav.favorites')}
          </Link>

          <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted">{t('nav.sections')}</p>
          {(categories ?? []).map((c) => (
            <Link key={c.id} to={`/properties?category=${encodeURIComponent(c.slug)}`} className={drawerLink} onClick={close}>
              {categoryName(c)}
            </Link>
          ))}

          <div className="my-4 border-t border-line" />
          <Link to="/cabinet/properties/new" className="btn-primary" onClick={close}>
            <Plus className="size-4" aria-hidden />
            {t('nav.postAd')}
          </Link>
          {status === 'authenticated' && user ? (
            <>
              <p className="mt-4 truncate px-3 text-sm font-semibold">{user.fullName}</p>
              {userMenu.map((item) =>
                item.to ? (
                  <Link key={item.key} to={item.to} className={drawerLink} onClick={close}>
                    <span className="text-muted">{item.icon}</span>
                    {item.label}
                  </Link>
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    className={`${drawerLink} text-danger`}
                    onClick={() => {
                      close()
                      item.onSelect?.()
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ),
              )}
            </>
          ) : (
            <div className="mt-2 grid gap-2">
              <Link to={loginUrl} className="btn-outline" onClick={close}>
                <LogIn className="size-4" aria-hidden />
                {t('nav.login')}
              </Link>
              <Link to={`/register?${new URLSearchParams({ returnTo: location.pathname + location.search })}`} className="btn-ghost" onClick={close}>
                <UserPlus className="size-4" aria-hidden />
                {t('nav.register')}
              </Link>
            </div>
          )}
        </nav>
      </Drawer>
    </header>
  )
}
