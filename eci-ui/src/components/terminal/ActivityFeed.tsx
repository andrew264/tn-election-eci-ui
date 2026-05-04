import { useState, useMemo } from 'react'
import { TermColors, chip } from './theme'
import { Panel } from './ui'
import type { FeedItem } from '../../types'

export default function ActivityFeed({
  feed,
  partyColorFn,
  flex = 0.85,
}: {
  feed: FeedItem[]
  partyColorFn: (code: string) => string
  flex?: number
}) {
  const [activityFilter, setActivityFilter] = useState('ALL')

  const filteredFeed = useMemo(() => {
    if (activityFilter === 'ALL') return feed
    if (activityFilter === 'MAJOR')
      return feed.filter((f) =>
        ['FLIP', 'DECLARATION', 'TALLY', 'NEW'].includes(f.kind),
      )
    return feed.filter((f) => f.kind === activityFilter)
  }, [feed, activityFilter])

  return (
    <Panel
      title="ACTIVITY"
      flex={flex}
      headerRight={
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'MAJOR', 'ROUND', 'SQUEEZE', 'FLIP'].map((s) => (
            <button
              key={s}
              onClick={() => setActivityFilter(s)}
              style={chip(activityFilter === s)}
            >
              {s}
            </button>
          ))}
        </div>
      }
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontSize: 11.5,
          overflow: 'auto',
          height: '100%',
        }}
      >
        {filteredFeed.map((f, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
              padding: 6,
              background: i === 0 ? TermColors.panelHi : 'transparent',
              borderLeft: `2px solid ${partyColorFn(f.party)}`,
            }}
          >
            <span
              style={{
                color: TermColors.dim,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {f.t}
            </span>
            <span
              style={{
                fontSize: 9,
                padding: '1px 5px',
                letterSpacing: 1,
                whiteSpace: 'nowrap',
                color:
                  f.kind === 'FLIP'
                    ? TermColors.amber
                    : f.kind === 'TALLY'
                      ? TermColors.cyan
                      : TermColors.dim,
                border: `1px solid ${f.kind === 'FLIP' ? TermColors.amber : f.kind === 'TALLY' ? TermColors.cyan : TermColors.border}`,
              }}
            >
              {f.kind}
            </span>
            <span style={{ flex: 1 }}>{f.text}</span>
          </div>
        ))}
        {filteredFeed.length === 0 && (
          <div
            style={{ padding: 20, textAlign: 'center', color: TermColors.dim }}
          >
            No activity matches filter.
          </div>
        )}
      </div>
    </Panel>
  )
}
