import { Controller, Get, Req, UseGuards } from "@nestjs/common"
import { StatsService } from "./stats.service"
import { AuthGuard } from "@nestjs/passport"

@Controller("stats")
export class StatsController {
  constructor(private readonly statsService: StatsService) {}
  @Get()
  @UseGuards(AuthGuard("jwt"))
  getStats(@Req() req) {
    return this.statsService.getStats(req.user.id)
  }
}
