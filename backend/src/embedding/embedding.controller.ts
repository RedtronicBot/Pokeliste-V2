import { Body, Controller, Post } from "@nestjs/common"
import { CompareCardDto } from "./dto/compareCard.dto"
import { EmbeddingService } from "./embedding.service"

@Controller("embedding")
export class EmbeddingController {
  constructor(private readonly embeddingService: EmbeddingService) {}

  @Post("compare")
  async compareCard(@Body() dto: CompareCardDto) {
    return this.embeddingService.comparePhoto(dto.image, dto.setId)
  }
}
