import { Injectable } from "@nestjs/common"
import pLimit from "p-limit"
import { PrismaService } from "prisma/prisma.service"
import { CardService } from "src/card/card.service"
import { SetBrief } from "src/types"
@Injectable()
export class SetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cardServices: CardService,
  ) {}

  async isEmpty() {
    return (await this.prisma.set.count()) === 0
  }

  async findBySet(setId: string) {
    const existingCards = await this.prisma.card.count({
      where: { setId },
    })

    const response = await fetch(`https://api.tcgdex.net/v2/fr/sets/${setId}`)

    if (!response.ok) {
      throw new Error("Erreur API TCGDex")
    }

    const data = await response.json()

    if (existingCards !== data.cardCount.total) {
      await this.cardServices.syncCardWithData(setId, data)
    }

    return this.prisma.set.findUnique({
      where: { id: setId },
      include: {
        cards: {
          include: {
            ownedVariant: true,
          },
          orderBy: {
            localId: "asc",
          },
        },
      },
    })
  }

  async syncSets() {
    const response = await fetch("https://api.tcgdex.net/v2/fr/sets")
    const sets: SetBrief[] = await response.json()
    const limit = pLimit(5)

    // Récupérer les sets déjà en DB pour éviter les appels inutiles
    const existingSets = await this.prisma.set.findMany({
      select: { id: true, seriesId: true },
    })
    const existingSetMap = new Map(existingSets.map((s) => [s.id, s]))

    // N'appeler l'API détaillée que pour les sets sans seriesId connu
    const detailedSets = await Promise.all(
      sets.map(async (set) =>
        limit(async () => {
          const existing = existingSetMap.get(set.id)
          if (existing?.seriesId) {
            return { ...set, serieId: existing.seriesId }
          }
          const res = await fetch(`https://api.tcgdex.net/v2/fr/sets/${set.id}`)
          const data = await res.json()
          return { ...set, serieId: data.serie.id }
        }),
      ),
    )

    await this.prisma.$transaction(
      detailedSets.map((set, index) => {
        return this.prisma.set.upsert({
          where: { id: set.id },
          update: {
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount.total,
            seriesId: set.serieId,
            position: index,
          },
          create: {
            id: set.id,
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount.total,
            seriesId: set.serieId,
            position: index,
          },
        })
      }),
    )
  }
}
