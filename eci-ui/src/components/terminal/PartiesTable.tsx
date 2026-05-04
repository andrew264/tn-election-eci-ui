import { useState, useMemo } from 'react'
import { TermColors, th, td } from './theme'
import { Panel } from './ui'
import type { Party } from '../../types'

export default function PartiesTable({
  parties,
  totalSeats,
  selectedParty,
  onSelectParty,
}: {
  parties: Party[]
  totalSeats: number
  selectedParty: string
  onSelectParty: (code: string) => void
}) {
  const [sortKey, setSortKey] = useState('total')
  const [sortDir, setSortDir] = useState('desc')

  const sortedParties = useMemo(() => {
    const arr = [...parties]
    arr.sort((a, b) => {
      const av =
        sortKey === 'won'
          ? a.won
          : sortKey === 'leading'
            ? a.leading
            : sortKey === 'total'
              ? a.won + a.leading
              : a.code
      const bv =
        sortKey === 'won'
          ? b.won
          : sortKey === 'leading'
            ? b.leading
            : sortKey === 'total'
              ? b.won + b.leading
              : b.code
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [parties, sortKey, sortDir])

  const handleSort = (k: string) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(k)
      setSortDir('desc')
    }
  }

  const arrow = (k: string) =>
    sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ' '

  return (
    <Panel
      title={`PARTIES — SORT: ${sortKey.toUpperCase()} ${sortDir.toUpperCase()}`}
      flex={1.05}
    >
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
      >
        <thead>
          <tr
            style={{
              color: TermColors.dim,
              textAlign: 'left',
              borderBottom: `1px solid ${TermColors.border}`,
            }}
          >
            <th style={th()}>#</th>
            <th style={th('pointer')} onClick={() => handleSort('code')}>
              PARTY {arrow('code')}
            </th>
            <th
              style={{ ...th('pointer'), textAlign: 'right' }}
              onClick={() => handleSort('won')}
            >
              WON {arrow('won')}
            </th>
            <th
              style={{ ...th('pointer'), textAlign: 'right' }}
              onClick={() => handleSort('leading')}
            >
              LEAD {arrow('leading')}
            </th>
            <th
              style={{ ...th('pointer'), textAlign: 'right' }}
              onClick={() => handleSort('total')}
            >
              +/- {arrow('total')}
            </th>
            <th style={{ ...th(), width: 110 }}>SHARE</th>
          </tr>
        </thead>
        <tbody>
          {sortedParties.map((p, i) => {
            const total = p.won + p.leading
            const sel = selectedParty === p.code
            return (
              <tr
                key={p.code}
                onClick={() => onSelectParty(p.code)}
                style={{
                  cursor: 'pointer',
                  background: sel ? TermColors.panelHi : 'transparent',
                  borderLeft: sel
                    ? `3px solid ${p.color}`
                    : '3px solid transparent',
                }}
              >
                <td style={td(TermColors.dim)}>
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td style={td()}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span
                      style={{ width: 8, height: 8, background: p.color }}
                    />
                    <span
                      style={{
                        color: sel ? p.color : TermColors.text,
                        fontWeight: sel ? 700 : 400,
                      }}
                    >
                      {p.short}
                    </span>
                  </div>
                </td>
                <td
                  style={{
                    ...td(),
                    textAlign: 'right',
                    color: p.won > 0 ? TermColors.green : TermColors.dim,
                  }}
                >
                  {p.won}
                </td>
                <td
                  style={{
                    ...td(),
                    textAlign: 'right',
                    color: TermColors.amber,
                  }}
                >
                  {p.leading}
                </td>
                <td style={{ ...td(), textAlign: 'right', fontWeight: 700 }}>
                  {total}
                </td>
                <td style={td()}>
                  <div
                    style={{
                      height: 6,
                      background: TermColors.panelHi,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: `${(total / totalSeats) * 100}%`,
                        background: p.color,
                      }}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}
