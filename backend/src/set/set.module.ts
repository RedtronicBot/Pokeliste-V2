import { Module } from "@nestjs/common"
import { SetService } from "./set.service"
import { SetController } from "./set.controller"
import { CardModule } from "src/card/card.module"

@Module({
  imports: [CardModule],
  providers: [SetService],
  controllers: [SetController],
  exports: [SetService],
})
export class SetModule {}
