import { Injectable } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}
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
      await this.syncCardWithData(setId, data)
    }

    return this.prisma.card.findMany({
      where: { setId },
    })
  }

  async syncCardWithData(setId: string, data: any) {
    await this.prisma.$transaction(
      data.cards.map((card) =>
        this.prisma.card.upsert({
          where: { id: card.id },
          update: {
            image: card.image,
            name: card.name,
            localId: card.localId,
            setId,
          },
          create: {
            id: card.id,
            image: card.image,
            name: card.name,
            localId: card.localId,
            setId,
          },
        }),
      ),
    )
  }
}
