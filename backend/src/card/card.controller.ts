import { Body, Controller, Param, Post } from "@nestjs/common"
import { CardService } from "./card.service"
import { CreateOwnedVariantDto } from "./dto/CreateOwnedVariant.dto"

@Controller("card")
export class CardController {
  constructor(private readonly cardService: CardService) {}
  @Post(":id")
  addOrUpdateOwnedCard(@Param("id") cardId: string, @Body() dto: CreateOwnedVariantDto) {
    return this.cardService.addOrUpdateOwnedCard(cardId, dto)
  }
}
