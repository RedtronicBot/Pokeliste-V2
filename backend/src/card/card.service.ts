import { Injectable } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"
import { CreateOwnedVariantDto } from "./dto/CreateOwnedVariant.dto"

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}

  addOrUpdateOwnedCard(cardId: string, dto: CreateOwnedVariantDto) {
    const { normal, reverse, holo, firstEdition, secondEdition } = dto
    const total = normal + holo + reverse + firstEdition + secondEdition

    if (total === 0) {
      return this.prisma.ownedVariant.deleteMany({
        where: { cardId },
      })
    }
    return this.prisma.ownedVariant.upsert({
      where: { cardId },
      update: {
        normal,
        reverse,
        holo,
        firstEdition,
        secondEdition,
      },
      create: {
        cardId,
        normal,
        reverse,
        holo,
        firstEdition,
        secondEdition,
      },
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
            localId: Number(card.localId),
            setId,
          },
          create: {
            id: card.id,
            image: card.image,
            name: card.name,
            localId: Number(card.localId),
            setId,
          },
        }),
      ),
    )
  }
}
