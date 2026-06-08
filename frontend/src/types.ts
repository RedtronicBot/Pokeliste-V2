export type Card = {
  id: string
  setId: string
  image: string
  name: string
  localId: string
  ownedVariant: OwnedVariant | null
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

export type DiscordUser = {
  id: string
  discordId: string
  username: string
  avatar: string | null
}

export type RawCard = Omit<Card, "ownedVariant"> & {
  ownedVariants: OwnedVariant[]
}

export type RawSetModel = Omit<SetModel, "cards"> & {
  cards: RawCard[]
}

export type ScanResult = {
  position: number
  match: {
    cardId: string
    goodMatches: number
    confidence: "high" | "medium" | "low"
  } | null
}
