import { Controller, Post, Body } from "@nestjs/common"
import { MatcherService } from "./matcher.service"

@Controller("matcher")
export class MatcherController {
  constructor(private readonly matcherService: MatcherService) {}

  @Post("compare-page")
  async comparePage(@Body() body: { image: string; setId: string }) {
    return this.matcherService.matchPage(body.image, body.setId)
  }
}
