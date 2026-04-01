export type SetBrief = {
  id: string
  name: string
  logo?: string
  symbol?: string
  cardCount: { total: number; official: number }
}
