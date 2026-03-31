import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { SeriesService } from "src/series/series.service"
import { SetService } from "src/set/set.service"

@Injectable()
export class SyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncService.name)

  constructor(
    private readonly seriesService: SeriesService,
    private readonly setService: SetService,
  ) {}

  async onApplicationBootstrap() {
    const needsSync = (await this.seriesService.isEmpty()) || (await this.setService.isEmpty())
    console.log(needsSync)
    if (needsSync) {
      this.logger.log("Base vide détectée, sync initial...")
      await this.handleCron()
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log("Lancement du sync quotidien")

    await this.seriesService.syncSeries()
    await this.setService.syncSets()

    this.logger.log("Sync terminé")
  }
}
