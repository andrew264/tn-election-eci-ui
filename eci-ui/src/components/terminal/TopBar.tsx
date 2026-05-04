import { TermColors } from './theme'

export default function TopBar({
  pollNumber,
  lastUpdate,
}: {
  pollNumber: number
  lastUpdate: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderBottom: `1px solid ${TermColors.border}`,
        paddingBottom: 8,
      }}
    >
      <div
        style={{ color: TermColors.amber, fontWeight: 700, letterSpacing: 1 }}
      >
        ECI/TN&gt;
      </div>
      <div style={{ color: TermColors.text }}>
        TAMIL NADU LEGISLATIVE ASSEMBLY · MAY 2026
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ color: TermColors.dim }}>POLL #</div>
      <div>{pollNumber}</div>
      <div style={{ color: TermColors.dim }}>LAST</div>
      <div>{lastUpdate}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 8,
            background: TermColors.green,
            boxShadow: `0 0 8px ${TermColors.green}`,
          }}
        />
        <span style={{ color: TermColors.green }}>LIVE · 30s INTERVAL</span>
      </div>
    </div>
  )
}
