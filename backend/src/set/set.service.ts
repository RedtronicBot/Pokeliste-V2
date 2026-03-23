import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { PrismaService } from "prisma/prisma.service"
import { SeriesService } from "src/series/series.service"
import { detectSeriesId } from "src/utils/detectSeriesId.utils"
@Injectable()
export class SetService {
  private readonly logger = new Logger(SetService.name)
  constructor(
    private readonly prisma: PrismaService,
    private readonly seriesService: SeriesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleCron() {
    this.logger.log("Lancement du sync quotidien des sets")
    await this.seriesService.syncSeries()
    await this.syncSets()
    this.logger.log("Sync terminé")
  }

  async findAll() {
    const existingSets = await this.prisma.set.count()

    if (existingSets === 0) {
      await this.syncSets()
    }

    return this.prisma.set.findMany({
      orderBy: {
        position: "asc",
      },
    })
  }

  async syncSets() {
    const response = await fetch("https://api.tcgdex.net/v2/fr/sets")
    const sets = await response.json()
    const series = await this.seriesService.findAll()
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
