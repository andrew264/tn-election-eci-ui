import { type ReactNode } from 'react'
import { TermColors } from './theme'

export function Panel({
  title,
  flex,
  headerRight,
  children,
}: {
  title: string
  flex?: number
  headerRight?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      style={{
        flex,
        background: TermColors.panel,
        border: `1px solid ${TermColors.border}`,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: `1px solid ${TermColors.border}`,
          fontSize: 10,
          letterSpacing: 1.2,
          color: TermColors.dim,
        }}
      >
        <span>{title}</span>
        <div style={{ flex: 1 }} />
        {headerRight}
      </div>
      <div style={{ padding: 10, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent?: string
}) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${accent || TermColors.borderHi}`,
        paddingLeft: 10,
      }}
    >
      <div style={{ color: TermColors.dim, fontSize: 9, letterSpacing: 1.2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          color: accent || TermColors.text,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  )
}
