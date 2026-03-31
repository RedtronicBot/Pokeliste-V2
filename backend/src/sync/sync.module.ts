import { Module } from "@nestjs/common"
import { SeriesModule } from "src/series/series.module"
import { SetModule } from "src/set/set.module"
import { SyncService } from "./sync.service"

@Module({
  imports: [SeriesModule, SetModule],
  providers: [SyncService],
})
export class SyncModule {}
