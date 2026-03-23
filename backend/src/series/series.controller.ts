import { Controller, Get } from "@nestjs/common"
import { SeriesService } from "./series.service"

@Controller("series")
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}
  @Get()
  findAll() {
    return this.seriesService.findAll()
  }
}
