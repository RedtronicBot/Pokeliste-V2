import { Injectable } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"
import { CardService } from "src/card/card.service"
import { detectSeriesId } from "src/utils/detectSeriesId.utils"
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
    const sets = await response.json()
    const series = await this.prisma.series.findMany()
    const seriesIds = series.map((s) => s.id)

    await this.prisma.$transaction(
      sets.map((set, index) => {
        const seriesId = detectSeriesId(set.id, seriesIds) ?? "misc"

        return this.prisma.set.upsert({
          where: { id: set.id },
          update: {
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount.total,
            seriesId,
            position: index,
          },
          create: {
            id: set.id,
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount.total,
            seriesId,
            position: index,
          },
        })
      }),
    )
  }
}
