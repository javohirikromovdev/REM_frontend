// Klaviatura, Escape va tashqariga bosish bilan ishlaydigan dropdown menyu
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Check } from 'lucide-react'

export interface DropdownItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  to?: string
  onSelect?: () => void
  checked?: boolean // radio uslubidagi tanlov (mavzu, til)
  danger?: boolean
}

interface Props {
  button: ReactNode
  ariaLabel: string
  items: DropdownItem[]
  buttonClassName?: string
  align?: 'start' | 'end'
  menuClassName?: string
}

export function Dropdown({ button, ariaLabel, items, buttonClassName = 'btn-ghost', align = 'end', menuClassName = 'w-56' }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const menuId = useId()

  const focusItem = (index: number) => {
    const n = items.length
    itemRefs.current[((index % n) + n) % n]?.focus()
  }

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const openAndFocus = (index: number) => {
    setOpen(true)
    requestAnimationFrame(() => focusItem(index))
  }

  const close = (returnFocus = true) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem(current + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem(current - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(items.length - 1)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const hasChecks = items.some((i) => i.checked !== undefined)
  const itemClass = (item: DropdownItem) =>
    `flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-start text-sm focus:outline-none focus-visible:bg-surface-2 hover:bg-surface-2 ${
      item.danger ? 'text-danger' : item.checked ? 'font-semibold text-accent' : 'text-fg'
    }`

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClassName}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? setOpen(false) : openAndFocus(Math.max(0, items.findIndex((i) => i.checked))))}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            openAndFocus(0)
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            openAndFocus(items.length - 1)
          } else if (e.key === 'Escape') setOpen(false)
        }}
      >
        {button}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          onKeyDown={onMenuKeyDown}
          className={`card absolute z-50 mt-2 max-h-[70vh] overflow-auto p-1.5 ${align === 'end' ? 'end-0' : 'start-0'} ${menuClassName}`}
        >
          {items.map((item, i) => {
            const content = (
              <>
                {item.icon && <span className="shrink-0 text-muted">{item.icon}</span>}
                <span className="min-w-0 flex-1 break-words">{item.label}</span>
                {hasChecks && item.checked && <Check className="size-4 shrink-0" aria-hidden />}
              </>
            )
            const role = item.checked !== undefined ? 'menuitemradio' : 'menuitem'
            return item.to ? (
              <Link
                key={item.key}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                to={item.to}
                role={role}
                tabIndex={-1}
                className={itemClass(item)}
                onClick={() => close(false)}
              >
                {content}
              </Link>
            ) : (
              <button
                key={item.key}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                type="button"
                role={role}
                aria-checked={item.checked}
                tabIndex={-1}
                className={itemClass(item)}
                onClick={() => {
                  item.onSelect?.()
                  close()
                }}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
