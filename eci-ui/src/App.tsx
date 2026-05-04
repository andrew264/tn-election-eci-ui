import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import type { AppData, Party, Constituency, FeedItem } from './types'
import TerminalDirection from './components/DirectionTerminal'

const PARTY_CONFIG: Record<string, { color: string; short: string }> = {
  TVK: { color: '#E11D48', short: 'TVK' },
  ADMK: { color: '#16A34A', short: 'AIADMK' },
  DMK: { color: '#DC2626', short: 'DMK' },
  PMK: { color: '#F59E0B', short: 'PMK' },
  INC: { color: '#0EA5E9', short: 'INC' },
  'CPI(M)': { color: '#B91C1C', short: 'CPI(M)' },
  DMDK: { color: '#FACC15', short: 'DMDK' },
  VCK: { color: '#1E40AF', short: 'VCK' },
  CPI: { color: '#991B1B', short: 'CPI' },
  IUML: { color: '#15803D', short: 'IUML' },
  BJP: { color: '#F97316', short: 'BJP' },
  AMMKMNKZ: { color: '#A855F7', short: 'AMMK' },
}

function getPartyMeta(fullName: string) {
  const code = fullName.split(' - ').pop()?.trim() || fullName
  return {
    code,
    full: fullName.split(' - ')[0],
    color: PARTY_CONFIG[code]?.color || '#666',
    short: PARTY_CONFIG[code]?.short || code,
  }
}

export default function App() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('/api/state')
        const json = await res.json()

        const parties: Party[] = Object.entries(json.main_data).map(
          ([partyName, stats]: any) => {
            const meta = getPartyMeta(partyName)
            return {
              ...meta,
              won: parseInt(stats.won) || 0,
              leading: parseInt(stats.leading) || 0,
            }
          },
        )

        const constituencies: Constituency[] = Object.entries(
          json.const_data || {},
        ).map(([name, detail]: any) => {
          const partyMeta = getPartyMeta(detail.party)
          const runnerUpMeta = getPartyMeta(detail.runner_up_party || 'NONE')

          return {
            id: detail.id,
            name: detail.name || name,
            party: partyMeta.code,
            candidate: detail.candidate,
            votes: parseInt(String(detail.votes).replace(/,/g, '')) || 0,
            margin: parseInt(String(detail.margin).replace(/,/g, '')) || 0,
            round: parseInt(detail.round) || 0,
            total: parseInt(detail.total) || 0,
            status: detail.type,
            flip: false,
            runnerUpParty: runnerUpMeta.code,
            runnerUpCandidate: detail.runner_up_candidate || 'None',
            candidates: (detail.candidates || []).map((c: any) => ({
              ...c,
              party: getPartyMeta(c.party).code,
            })),
          }
        })

        const feed: FeedItem[] = (json.logs || []).map((log: any) => {
          let party = 'UNKNOWN'
          if (log.msg.includes('TVK')) party = 'TVK'
          if (log.msg.includes('ADMK')) party = 'ADMK'
          if (log.msg.includes('DMK')) party = 'DMK'

          return {
            t: log.time,
            kind: log.type,
            text: log.msg,
            party,
          }
        })

        setData({
          parties,
          constituencies,
          feed,
          lastUpdate: json.last_updated,
          pollNumber: json.poll_count,
          totalSeats: 234,
          majority: 118,
        })
      } catch (err) {
        console.error('Failed to fetch state:', err)
      }
    }

    fetchState()
    const interval = setInterval(fetchState, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!data)
    return (
      <div
        style={{
          color: 'white',
          padding: 40,
          background: '#1a1a1a',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        Connecting to Live Election Server...
      </div>
    )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TerminalDirection data={data} />} />
      </Routes>
    </BrowserRouter>
  )
}
