import { Module } from "@nestjs/common"
import { SetService } from "./set.service"
import { SetController } from "./set.controller"
import { CardModule } from "src/card/card.module"
import { EmbeddingModule } from "src/embedding/embedding.module"

@Module({
  imports: [CardModule, EmbeddingModule],
  providers: [SetService],
  controllers: [SetController],
  exports: [SetService],
})
export class SetModule {}
