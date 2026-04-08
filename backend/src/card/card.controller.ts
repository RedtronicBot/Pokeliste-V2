import { Body, Controller, Param, Post, Req, UseGuards } from "@nestjs/common"
import { CardService } from "./card.service"
import { CreateOwnedVariantDto } from "./dto/CreateOwnedVariant.dto"
import { AuthGuard } from "@nestjs/passport"

@Controller("card")
export class CardController {
  constructor(private readonly cardService: CardService) {}
  @Post(":id")
  @UseGuards(AuthGuard("jwt"))
  addOrUpdateOwnedCard(@Param("id") cardId: string, @Body() dto: CreateOwnedVariantDto, @Req() req) {
    return this.cardService.addOrUpdateOwnedCard(req.user.id, cardId, dto)
  }
}
