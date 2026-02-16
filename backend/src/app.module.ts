import { Module } from "@nestjs/common"
import { PrismaModule } from "prisma/prisma.module"
import { SetModule } from "./set/set.module"
import { ScheduleModule } from "@nestjs/schedule"
import { CardModule } from './card/card.module';

@Module({
  imports: [PrismaModule, SetModule, ScheduleModule.forRoot(), CardModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
