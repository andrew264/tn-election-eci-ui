import { useState, useMemo } from 'react'
import { TermColors, th, td, chip } from './theme'
import { Panel } from './ui'
import type { Constituency, Party } from '../../types'

export default function ConstituenciesTable({
  constituencies,
  partyInfo,
  partyColorFn,
  selectedAc,
  onSelectAc,
}: {
  constituencies: Constituency[]
  partyInfo?: Party
  partyColorFn: (code: string) => string
  selectedAc: number | null
  onSelectAc: (id: number) => void
}) {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState<keyof Constituency>('margin')
  const [sortDir, setSortDir] = useState('desc')

  const sortedConstituencies = useMemo(() => {
    let arr = [...constituencies]
    if (statusFilter !== 'ALL')
      arr = arr.filter((c) => c.status === statusFilter)

    arr.sort((a, b) => {
      let av = a[sortKey]
      let bv = b[sortKey]

      if (typeof av === 'string' && typeof bv === 'string') {
        av = av.toLowerCase()
        bv = bv.toLowerCase()
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [constituencies, statusFilter, sortKey, sortDir])

  const handleSort = (k: keyof Constituency) => {
    if (sortKey === k) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(k)
      setSortDir('desc')
    }
  }

  const arrow = (k: keyof Constituency) =>
    sortKey === k ? (sortDir === 'asc' ? '▲' : '▼') : ' '

  return (
    <Panel
      title={`CONSTITUENCIES · ${partyInfo?.short || 'NONE'}`}
      flex={1.4}
      headerRight={
        <div style={{ display: 'flex', gap: 4 }}>
          {['ALL', 'Leading', 'Won'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={chip(statusFilter === s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      }
    >
      <div style={{ overflow: 'auto', height: '100%' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}
        >
          <thead
            style={{ position: 'sticky', top: 0, background: TermColors.panel }}
          >
            <tr
              style={{
                color: TermColors.dim,
                textAlign: 'left',
                borderBottom: `1px solid ${TermColors.border}`,
              }}
            >
              <th style={th('pointer')} onClick={() => handleSort('id')}>
                AC {arrow('id')}
              </th>
              <th style={th('pointer')} onClick={() => handleSort('name')}>
                CONSTITUENCY {arrow('name')}
              </th>
              <th style={th('pointer')} onClick={() => handleSort('candidate')}>
                CANDIDATE {arrow('candidate')}
              </th>
              <th
                style={{ ...th('pointer'), textAlign: 'right' }}
                onClick={() => handleSort('votes')}
              >
                VOTES {arrow('votes')}
              </th>
              <th
                style={{ ...th('pointer'), textAlign: 'right' }}
                onClick={() => handleSort('margin')}
              >
                MARGIN {arrow('margin')}
              </th>
              <th
                style={{ ...th('pointer'), width: 90 }}
                onClick={() => handleSort('round')}
              >
                ROUND {arrow('round')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedConstituencies.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectAc(c.id)}
                style={{
                  borderBottom: `1px solid ${TermColors.border}`,
                  background:
                    selectedAc === c.id ? TermColors.panelHi : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <td style={{ ...td(TermColors.dim), width: 42 }}>{c.id}</td>
                <td style={td()}>
                  <span>{c.name}</span>
                  {c.flip && (
                    <span
                      style={{
                        marginLeft: 6,
                        color: TermColors.amber,
                        fontSize: 9,
                        border: `1px solid ${TermColors.amber}`,
                        padding: '1px 4px',
                      }}
                    >
                      FLIP
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...td(TermColors.dim),
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.candidate}
                </td>
                <td style={{ ...td(), textAlign: 'right' }}>
                  {(c.votes || 0).toLocaleString()}
                </td>
                <td
                  style={{
                    ...td(),
                    textAlign: 'right',
                    color:
                      (c.margin || 0) > 5000
                        ? TermColors.green
                        : (c.margin || 0) < 1000
                          ? TermColors.red
                          : TermColors.amber,
                  }}
                >
                  +{(c.margin || 0).toLocaleString()}
                </td>
                <td style={td()}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <div
                      style={{
                        flex: 1,
                        height: 4,
                        background: TermColors.panelHi,
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${((c.round || 0) / (c.total || 1)) * 100}%`,
                          background: partyColorFn(c.party),
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: TermColors.dim,
                        fontSize: 10,
                        minWidth: 32,
                        textAlign: 'right',
                      }}
                    >
                      {c.round || 0}/{c.total || 0}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedConstituencies.length === 0 && (
          <div
            style={{ padding: 20, textAlign: 'center', color: TermColors.dim }}
          >
            No data available yet.
          </div>
        )}
      </div>
    </Panel>
  )
}
