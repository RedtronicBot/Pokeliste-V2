import { Injectable, Logger } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"
import { CreateOwnedVariantDto } from "./dto/CreateOwnedVariant.dto"
import * as fs from "fs/promises"
import * as path from "path"

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}
  private readonly logger = new Logger(CardService.name)
  private readonly imagesDir = path.join(process.cwd(), "images")

  addOrUpdateOwnedCard(userId: string, cardId: string, dto: CreateOwnedVariantDto) {
    const { normal, reverse, holo, firstEdition, secondEdition } = dto
    const total = normal + holo + reverse + firstEdition + secondEdition

    if (total === 0) {
      return this.prisma.ownedVariant.deleteMany({
        where: { userId, cardId },
      })
    }
    return this.prisma.ownedVariant.upsert({
      where: { userId_cardId: { userId, cardId } },
      update: {
        normal,
        reverse,
        holo,
        firstEdition,
        secondEdition,
      },
      create: {
        userId,
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
    await this.downloadSetImages(setId, data.cards)
  }

  private async downloadSetImages(setId: string, cards: any[]) {
    const setDir = path.join(this.imagesDir, setId)

    try {
      await fs.access(setDir)
      this.logger.log(`Images déjà présentes pour ${setId}`)
      return
    } catch {
      await fs.mkdir(setDir, { recursive: true })
    }

    this.logger.log(`Téléchargement des images pour ${setId} (${cards.length} cartes)`)

    let success = 0
    let failed = 0

    for (const card of cards) {
      try {
        const url = `${card.image}/low.webp`
        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const buffer = Buffer.from(await response.arrayBuffer())
        const filePath = path.join(setDir, `${card.id}.webp`)
        await fs.writeFile(filePath, buffer)
        success++
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`Échec téléchargement ${card.id}: ${message}`)
        failed++
      }
    }

    this.logger.log(`Images téléchargées: ${success} OK, ${failed} échecs`)
  }
}
