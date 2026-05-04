import { TermColors } from './theme'
import { Panel, Stat } from './ui'
import type { Party, AppData } from '../../types'

export default function Banner({
  leader,
  parties,
  data,
  totalCounted,
  flipsToday,
}: {
  leader: Party
  parties: Party[]
  data: AppData
  totalCounted: number
  flipsToday: number
}) {
  const leaderTotal = (leader?.won || 0) + (leader?.leading || 0)

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Panel title="LEADER · PROJECTED MAJORITY" flex={1.7}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <div style={{ width: 6, height: 56, background: leader?.color }} />
          <div>
            <div
              style={{ color: TermColors.dim, fontSize: 10, letterSpacing: 1 }}
            >
              LEADING / WON
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1,
                color: leader?.color,
              }}
            >
              {leaderTotal}
              <span style={{ fontSize: 18, color: TermColors.dim }}>
                /{data.totalSeats}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>{leader?.full.toUpperCase()}</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: TermColors.dim, fontSize: 10 }}>
              MAJORITY MARK
            </div>
            <div style={{ fontSize: 22, color: TermColors.amber }}>
              {data.majority}
            </div>
            <div
              style={{ color: TermColors.green, fontSize: 11, marginTop: 2 }}
            >
              +{leaderTotal - data.majority} OVER
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            height: 14,
            background: TermColors.panelHi,
            border: `1px solid ${TermColors.border}`,
            position: 'relative',
          }}
        >
          {(() => {
            let acc = 0
            return parties.map((p) => {
              const w = ((p.won + p.leading) / data.totalSeats) * 100
              const left = acc
              acc += w
              return (
                <div
                  key={p.code}
                  title={`${p.code} ${p.won + p.leading}`}
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: 0,
                    bottom: 0,
                    width: `${w}%`,
                    background: p.color,
                  }}
                />
              )
            })
          })()}
          <div
            style={{
              position: 'absolute',
              top: -4,
              bottom: -4,
              left: `${(data.majority / data.totalSeats) * 100}%`,
              width: 1,
              background: TermColors.amber,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: -16,
              left: `${(data.majority / data.totalSeats) * 100}%`,
              color: TermColors.amber,
              fontSize: 9,
              transform: 'translateX(-50%)',
            }}
          >
            {data.majority} ▼
          </div>
        </div>
      </Panel>

      <Panel title="STATE OVERVIEW" flex={1}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Stat
            label="DECLARED"
            value={parties.reduce((s, p) => s + p.won, 0)}
          />
          <Stat label="COUNTING" value={totalCounted} />
          <Stat
            label="PARTIES"
            value={parties.length}
            accent={TermColors.cyan}
          />
          <Stat
            label="FLIPS TODAY"
            value={flipsToday}
            accent={TermColors.amber}
          />
        </div>
      </Panel>
    </div>
  )
}
