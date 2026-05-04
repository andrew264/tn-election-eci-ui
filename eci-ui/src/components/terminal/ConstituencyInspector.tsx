import { TermColors, th, td } from './theme'
import { Panel } from './ui'
import type { Constituency } from '../../types'

export default function ConstituencyInspector({
  constituency,
  partyColorFn,
}: {
  constituency: Constituency | null
  partyColorFn: (code: string) => string
}) {
  if (!constituency) {
    return (
      <Panel title="INSPECTOR" flex={1}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: TermColors.dim,
          }}
        >
          SELECT A CONSTITUENCY TO VIEW DETAILS
        </div>
      </Panel>
    )
  }

  const { name, round, total, status, candidates } = constituency
  const pct = total > 0 ? (round / total) * 100 : 0

  return (
    <Panel
      title={`[AC-${constituency.id.toString().padStart(3, '0')}] ${name}`}
      flex={1}
      headerRight={
        <div
          style={{
            color: status === 'Won' ? TermColors.green : TermColors.cyan,
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {status}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ color: TermColors.dim, fontSize: 10 }}>
            ROUND {round}/{total}
          </div>
          <div style={{ flex: 1, height: 4, background: TermColors.panelHi }}>
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: TermColors.amber,
              }}
            />
          </div>
          <div style={{ color: TermColors.dim, fontSize: 10 }}>
            {pct.toFixed(1)}%
          </div>
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 11.5,
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                background: TermColors.panel,
              }}
            >
              <tr
                style={{
                  color: TermColors.dim,
                  textAlign: 'left',
                  borderBottom: `1px solid ${TermColors.border}`,
                }}
              >
                <th style={th()}>POS</th>
                <th style={th()}>CANDIDATE</th>
                <th style={th()}>PARTY</th>
                <th style={{ ...th(), textAlign: 'right' }}>VOTES</th>
                <th style={{ ...th(), textAlign: 'right' }}>MARGIN</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const isNota = c.name.toUpperCase().includes('NOTA')
                const isLeader = c.pos === 1
                const color = partyColorFn(c.party)

                return (
                  <tr
                    key={c.name}
                    style={{
                      borderBottom: `1px solid ${TermColors.border}`,
                      background: isLeader ? TermColors.panelHi : 'transparent',
                      opacity: isNota ? 0.6 : 1,
                    }}
                  >
                    <td style={td(TermColors.dim)}>#{c.pos || '-'}</td>
                    <td style={td(isLeader ? color : TermColors.text)}>
                      {c.name}
                    </td>
                    <td style={td(color)}>{c.party}</td>
                    <td style={{ ...td(), textAlign: 'right' }}>
                      {c.votes.toLocaleString()}
                    </td>
                    <td
                      style={{
                        ...td(
                          c.margin_to_leader === 0
                            ? TermColors.dim
                            : TermColors.amber,
                        ),
                        textAlign: 'right',
                      }}
                    >
                      {c.margin_to_leader === 0
                        ? '-'
                        : c.margin_to_leader.toLocaleString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  )
}
