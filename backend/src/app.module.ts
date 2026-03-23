import { Module } from "@nestjs/common"
import { PrismaModule } from "prisma/prisma.module"
import { SetModule } from "./set/set.module"
import { ScheduleModule } from "@nestjs/schedule"
import { CardModule } from "./card/card.module"
import { ConfigModule } from "@nestjs/config"
import { SeriesModule } from "./series/series.module"

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, SetModule, ScheduleModule.forRoot(), CardModule, SeriesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
