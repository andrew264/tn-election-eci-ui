import { useState } from 'react'
import type { AppData } from '../types'
import { TermColors } from './terminal/theme'
import TopBar from './terminal/TopBar'
import Banner from './terminal/Banner'
import PartiesTable from './terminal/PartiesTable'
import ConstituenciesTable from './terminal/ConstituenciesTable'
import ActivityFeed from './terminal/ActivityFeed'
import ConstituencyInspector from './terminal/ConstituencyInspector'
import Ticker from './terminal/Ticker'

export default function TerminalDirection({ data }: { data: AppData }) {
  const parties = [...data.parties].sort(
    (a, b) => b.won + b.leading - (a.won + a.leading),
  )

  const [selectedParty, setSelectedParty] = useState(parties[0]?.code || 'TVK')
  const [selectedAc, setSelectedAc] = useState<number | null>(null)

  const totalCounted = parties.reduce((s, p) => s + p.won + p.leading, 0)
  const flipsToday = data.feed.filter((f) => f.kind === 'FLIP').length

  // The global leader is always the first party in the sorted list.
  const leader = parties[0]

  const partyColorFn = (code: string) =>
    data.parties.find((p) => p.code === code)?.color || '#666'

  const selectedConstituencies = data.constituencies.filter(
    (c) => c.party === selectedParty,
  )
  const selectedPartyInfo = parties.find((p) => p.code === selectedParty)
  const inspectedConstituency =
    data.constituencies.find((c) => c.id === selectedAc) || null

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: TermColors.bg,
        color: TermColors.text,
        fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace",
        fontSize: 12,
        padding: 12,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <TopBar pollNumber={data.pollNumber} lastUpdate={data.lastUpdate} />

      <Banner
        leader={leader}
        parties={parties}
        data={data}
        totalCounted={totalCounted}
        flipsToday={flipsToday}
      />

      <div style={{ display: 'flex', gap: 8, flex: 1, minHeight: 0 }}>
        <PartiesTable
          parties={parties}
          totalSeats={data.totalSeats}
          selectedParty={selectedParty}
          onSelectParty={setSelectedParty}
        />

        <ConstituenciesTable
          constituencies={selectedConstituencies}
          partyInfo={selectedPartyInfo}
          partyColorFn={partyColorFn}
          selectedAc={selectedAc}
          onSelectAc={setSelectedAc}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 0.9,
            gap: 8,
          }}
        >
          <ActivityFeed feed={data.feed} partyColorFn={partyColorFn} flex={1} />
          <ConstituencyInspector
            constituency={inspectedConstituency}
            partyColorFn={partyColorFn}
          />
        </div>
      </div>

      <Ticker feed={data.feed} partyColorFn={partyColorFn} />
    </div>
  )
}
