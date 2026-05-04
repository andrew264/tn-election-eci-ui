export interface Party {
  code: string
  full: string
  won: number
  leading: number
  color: string
  short: string
}

export interface Candidate {
  pos: number
  name: string
  party: string
  votes: number
  margin_to_leader: number
  status: string
}

export interface Constituency {
  id: number
  name: string
  party: string
  candidate: string
  votes: number
  margin: number
  round: number
  total: number
  status: string
  flip: boolean
  runnerUpParty: string
  runnerUpCandidate: string
  candidates: Candidate[]
}

export interface FeedItem {
  t: string
  kind: string
  text: string
  party: string
}

export interface AppData {
  parties: Party[]
  constituencies: Constituency[]
  feed: FeedItem[]
  lastUpdate: string
  pollNumber: number
  totalSeats: number
  majority: number
}
