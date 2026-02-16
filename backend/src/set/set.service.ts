import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "prisma/prisma.service"

@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name)
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log("Lancement du sync quotidien des sets")
    await this.syncSets()
    this.logger.log("Sync terminé")
  }

  async findAll() {
    const existingSets = await this.prisma.set.count()

    if (existingSets === 0) {
      await this.syncSets()
    }

    return this.prisma.set.findMany()
  }

  async syncSets() {
    const response = await fetch("https://api.tcgdex.net/v2/fr/sets")
    const sets = await response.json()
    await this.prisma.$transaction(
      sets.map((set) =>
        this.prisma.set.upsert({
          where: { id: set.id },
          update: {
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount,
          },
          create: {
            id: set.id,
            name: set.name,
            logo: set.logo,
            symbol: set.symbol,
            cardCount: set.cardCount,
          },
        }),
      ),
    )
  }
}
