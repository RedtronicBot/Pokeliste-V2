export type Card = {
  id: string
  setId: string
  image: string
  name: string
  localId: string
  ownedVariant: OwnedVariant
}

export type OwnedVariant = {
  id: number
  cardId: string
  normal: number
  holo: number
  reverse: number
  firstEdition: number
  secondEdition: number
}

export type SetModel = {
  id: string
  name: string
  logo?: string
  symbol?: string
  cardCount: number
  position: string
  seriesId: string
  cards: Card[]
}

export type Series = {
  id: string
  name: string
  logo: string
  position: string
  sets: SetModel[]
}
