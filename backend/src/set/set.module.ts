import { Module } from "@nestjs/common"
import { SetService } from "./set.service"
import { SetController } from "./set.controller"
import { SeriesModule } from "src/series/series.module"

@Module({
  imports: [SeriesModule],
  providers: [SetService],
  controllers: [SetController],
})
export class SetModule {}
