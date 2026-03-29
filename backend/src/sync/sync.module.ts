import { Module } from "@nestjs/common"
import { SeriesModule } from "src/series/series.module"
import { SetModule } from "src/set/set.module"

@Module({
  imports: [SeriesModule, SetModule],
})
export class SyncModule {}
