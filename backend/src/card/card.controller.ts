import { Body, Controller, Get, Param, Post } from "@nestjs/common"
import { CardService } from "./card.service"
import { CreateOwnedVariantDto } from "./dto/CreateOwnedVariant.dto"

@Controller("card")
export class CardController {
  constructor(private readonly cardService: CardService) {}
  @Post(":id")
  addOrUpdateOwnedCard(@Param("id") cardId: string, @Body() dto: CreateOwnedVariantDto) {
    return this.cardService.addOrUpdateOwnedCard(cardId, dto)
  }

  @Get("/set/:id")
  findBySet(@Param("id") id: string) {
    return this.cardService.findBySet(id)
  }
}
