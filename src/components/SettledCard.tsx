import { useState } from 'react'
import type { ClosedPosition } from '../api/types'
import { CardShell } from './CardShell'
import { MicroStat, PnlHero } from './CardViewParts'
import { PositionIdRow } from './PositionCard'

const reasonLabels: Record<string, string> = {
  closed: 'Closed',
  settled: 'Settled',
  liquidated: 'Liquidated',
  reverted: 'Reverted',
  cancelled: 'Cancelled',
}

export function SettledCard({
  position,
  onClick,
  isSelected,
}: {
  position: ClosedPosition
  onClick?: () => void
  isSelected?: boolean
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const displayTitle = position.marketTitle || position.marketTicker

  const copyToClipboard = (value: string, key: string) => {
    navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500)
  }

  const realizedPnl = parseFloat(position.result.realizedPnlUsd)
  const pnlColor = realizedPnl >= 0 ? 'var(--green)' : 'var(--red)'
  const pnlPrefix = realizedPnl >= 0 ? '+' : ''
  const entryCollateral = parseFloat(position.entry.collateralUsd)
  const roePct = entryCollateral > 0 ? (realizedPnl / entryCollateral) * 100 : 0

  const reason = reasonLabels[position.closeReason] || position.closeReason
  const isLiquidated = position.closeReason === 'liquidated'
  const isReverted = position.closeReason === 'reverted'

  const openedAtLabel = position.entry.openedAt
    ? new Date(position.entry.openedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <CardShell
      variant="settled"
      onClick={onClick}
      style={isSelected ? { border: '1px solid var(--yellow-border)' } : undefined}
    >
      <div style={{ position: 'relative', zIndex: 1, padding: '22px 24px 20px' }}>
        {openedAtLabel && (
          <div
            style={{
              fontSize: 10,
              color: 'var(--text-dim)',
              marginBottom: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Opened {openedAtLabel}
          </div>
        )}
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: collapsed ? 0 : 16,
          }}
        >
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div
              onClick={(e) => {
                e.stopPropagation()
                copyToClipboard(position.marketTicker, 'marketTicker')
              }}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: copiedKey === 'marketTicker' ? 'var(--green)' : '#ffffff',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                textOverflow: 'ellipsis',
                cursor: 'pointer',
                transition: 'color 0.2s',
                lineHeight: 1.3,
              }}
              title={
                copiedKey === 'marketTicker'
                  ? 'Ticker copied'
                  : `${displayTitle} — click to copy ticker`
              }
            >
              {copiedKey === 'marketTicker' ? '✓ Ticker copied' : displayTitle}
            </div>
            <PositionIdRow
              positionId={position.id}
              copied={copiedKey === 'positionId'}
              onCopy={(e) => {
                e.stopPropagation()
                copyToClipboard(position.id, 'positionId')
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isLiquidated || isReverted ? 'var(--red)' : 'var(--text-muted)',
                background: isLiquidated || isReverted
                  ? 'var(--red-soft)'
                  : 'var(--surface-subtle)',
                border: `1px solid ${
                  isLiquidated || isReverted
                    ? 'rgba(224,82,82,0.2)'
                    : 'var(--border)'
                }`,
                borderRadius: 0,
                padding: '2px 8px',
                textTransform: 'uppercase',
              }}
            >
              {reason}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setCollapsed((c) => !c)
              }}
              aria-label={collapsed ? 'Expand position card' : 'Collapse position card'}
              aria-expanded={!collapsed}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 0,
                color: 'var(--text-dim)',
                cursor: 'pointer',
                padding: '2px 6px',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <PnlHero
              label="Realized PnL"
              value={`${pnlPrefix}$${Math.abs(realizedPnl).toFixed(2)}`}
              pctValue={`${pnlPrefix}${roePct.toFixed(1)}%`}
              color={pnlColor}
            />

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '14px 18px',
              }}
            >
              <MicroStat label="Entry price" value={`$${position.entry.priceUsd}`} />
              <MicroStat
                label="Proceeds"
                value={`$${position.result.proceedsUsd}`}
                valueColor={pnlColor}
              />
              <MicroStat label="Total fees" value={`$${position.fees.totalFeesUsd}`} />
              <MicroStat
                label="Effective leverage"
                value={`${(position.effectiveLeverageBps / 10000).toFixed(1)}x`}
              />
            </div>
          </>
        )}
      </div>
    </CardShell>
  )
}
