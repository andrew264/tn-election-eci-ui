import { TermColors } from './theme'
import type { FeedItem } from '../../types'

export default function Ticker({
  feed,
  partyColorFn,
}: {
  feed: FeedItem[]
  partyColorFn: (code: string) => string
}) {
  return (
    <div
      style={{
        borderTop: `1px solid ${TermColors.border}`,
        padding: '6px 4px',
        display: 'flex',
        gap: 24,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        color: TermColors.dim,
        fontSize: 11,
      }}
    >
      <span style={{ color: TermColors.amber }}>TICKER ›</span>
      {feed.slice(0, 6).map((f, i) => (
        <span key={i}>
          <span style={{ color: partyColorFn(f.party) }}>●</span> {f.text}
        </span>
      ))}
    </div>
  )
}
