import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common"
import { SetService } from "./set.service"
import { OptionalJwtGuard } from "src/auth/guards/optional_jwt.guard"

@Controller("set")
export class SetController {
  constructor(private readonly setService: SetService) {}

  @Get(":id")
  @UseGuards(OptionalJwtGuard)
  findBySet(@Param("id") id: string, @Req() req) {
    return this.setService.findBySet(id, req.user?.id ?? null)
  }
}
