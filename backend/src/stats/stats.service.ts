import { Injectable } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const series = await this.prisma.series.findMany({
      include: {
        sets: {
          include: {
            cards: {
              include: {
                ownedVariants: {
                  where: { userId },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    return series.map((serie) => ({
      id: serie.id,
      name: serie.name,
      sets: serie.sets.map((set) => ({
        id: set.id,
        name: set.name,
        cardCount: set.cardCount,
        ownedCount: set.cards.filter((c) => c.ownedVariants.length > 0).length,
        variants: set.cards.reduce(
          (acc, card) => {
            const variant = card.ownedVariants[0]
            if (!variant) return acc
            return {
              normal: acc.normal + variant.normal,
              holo: acc.holo + variant.holo,
              reverse: acc.reverse + variant.reverse,
              firstEdition: acc.firstEdition + variant.firstEdition,
              secondEdition: acc.secondEdition + variant.secondEdition,
            }
          },
          { normal: 0, holo: 0, reverse: 0, firstEdition: 0, secondEdition: 0 },
        ),
      })),
    }))
  }
}
