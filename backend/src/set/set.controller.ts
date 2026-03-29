import { Controller, Get, Param } from "@nestjs/common"
import { SetService } from "./set.service"

@Controller("set")
export class SetController {
  constructor(private readonly setService: SetService) {}

  @Get(":id")
  findBySet(@Param("id") id: string) {
    return this.setService.findBySet(id)
  }
}
