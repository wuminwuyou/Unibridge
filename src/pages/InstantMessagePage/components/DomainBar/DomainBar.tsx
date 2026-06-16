import { useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Settings } from 'lucide-react'
import type { DomainNode } from '../../types'

interface DomainItemProps {
  domain: DomainNode
  onClick: (id: string) => void
  showActiveBar?: boolean
}

function DomainItem({ domain, onClick, showActiveBar = true }: DomainItemProps) {
  const isActive = domain.isActive ?? false
  const isDashed = domain.isDashed ?? false
  const hasHoverTransition = domain.hoverShapeTransition ?? false

  const btnRef = useRef<HTMLButtonElement>(null)
  const [tooltipRect, setTooltipRect] = useState<{ top: number; left: number } | null>(null)

  const handleMouseEnter = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setTooltipRect({ top: rect.top + rect.height / 2, left: rect.right + 10 })
    }
  }, [])

  const handleMouseLeave = useCallback(() => { setTooltipRect(null) }, [])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={'domain-item' + (isActive ? ' domain-item--active' : '') + (isDashed ? ' domain-item--dashed' : '') + (hasHoverTransition ? ' domain-item--hover-shape' : '')}
        onClick={() => onClick(domain.id)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={domain.label}
      >
        {isActive && showActiveBar ? <span className="domain-item__active-bar" aria-hidden="true" /> : null}
        {domain.kind === 'notification' && <Bell className="domain-item__notify-icon" size={18} strokeWidth={1.5} />}
        {domain.kind === 'settings' && <Settings className="domain-item__settings-icon" size={18} strokeWidth={1.5} />}
        {domain.kind !== 'notification' && domain.kind !== 'settings' && (
          <span className="domain-item__label-text">{domain.shortLabel ?? domain.label[0]}</span>
        )}
        {domain.unread ? (
          domain.unreadCount && domain.unreadCount > 1 ? (
            <span className="domain-item__badge">{domain.unreadCount > 99 ? '99+' : domain.unreadCount}</span>
          ) : (<span className="domain-item__dot" aria-hidden="true" />)
        ) : null}
      </button>
      {tooltipRect ? createPortal(
        <div className="domain-item__tooltip domain-item__tooltip--portal" style={{ position: 'fixed', top: tooltipRect.top, left: tooltipRect.left, transform: 'translateY(-50%)', zIndex: 9999, padding: '0.375rem 0.75rem', borderRadius: '0.5rem', background: 'rgb(24 24 27 / 95%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgb(63 63 70 / 60%)', color: '#e4e4e7', fontSize: '0.75rem', lineHeight: '1.25', whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)' }}>{domain.label}</div>,
        document.body
      ) : null}
    </>
  )
}

function UserAvatar() {
  return (
    <div className="domain-bar__avatar" title="个人头像" aria-label="个人头像">
      <span className="domain-bar__avatar-text">我</span>
    </div>
  )
}

export interface DomainBarProps {
  domains: DomainNode[]
  onSelectDomain: (domainId: string) => void
}

export function DomainBar({ domains, onSelectDomain }: DomainBarProps) {
  const middleDomains = useMemo(() => domains.filter(d => d.kind === 'team' || d.kind === 'project'), [domains])
  const bottomDomains = useMemo(() => domains.filter(d => d.kind === 'temporary' || d.kind === 'notification' || d.kind === 'settings'), [domains])
  const teamDomains = useMemo(() => middleDomains.filter(d => d.kind === 'team'), [middleDomains])
  const projectDomains = useMemo(() => middleDomains.filter(d => d.kind === 'project'), [middleDomains])

  return (
    <nav className="domain-bar" aria-label="域导航">
      <div className="domain-bar__top">
        <UserAvatar />
      </div>
      <div className="domain-bar__middle">
        {teamDomains.length > 0 && (
          <>
            <div className="domain-bar__section">
              {teamDomains.map(d => <DomainItem key={d.id} domain={d} onClick={onSelectDomain} />)}
            </div>
            <div className="domain-bar__divider" aria-hidden="true" />
          </>
        )}
        {projectDomains.length > 0 && (
          <div className="domain-bar__section">
            {projectDomains.map(d => <DomainItem key={d.id} domain={d} onClick={onSelectDomain} />)}
          </div>
        )}
      </div>
      <div className="domain-bar__bottom">
        <div className="domain-bar__divider" aria-hidden="true" />
        {bottomDomains.map(d => <DomainItem key={d.id} domain={d} onClick={onSelectDomain} showActiveBar={false} />)}
      </div>
    </nav>
  )
}

export default DomainBar
