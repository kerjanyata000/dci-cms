export type RenewalKind = 'renewal' | 'expiry' | 'termination'

export type RenewalAgendaItem = {
  id: string
  partyId: string
  partyCode: string
  partyName: string
  pic: string | null
  contractId: string | null
  contractCode: string | null
  contractTitle: string | null
  kind: RenewalKind
  eventDate: string
  durationLabel: string
  daysLeft: number
  bucket: 'urgent' | 'soon' | 'later'
}

export type RenewalSummary = {
  urgent: number
  soon: number
  later: number
  inMonth: number
}
