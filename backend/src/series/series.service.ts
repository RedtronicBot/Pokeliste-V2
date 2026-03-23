import { Injectable } from "@nestjs/common"
import { PrismaService } from "prisma/prisma.service"

@Injectable()
export class SeriesService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll() {
    const existingSeries = await this.prisma.series.count()

    if (existingSeries === 0) {
      await this.syncSeries()
    }

    return this.prisma.series.findMany({
      orderBy: {
        position: "asc",
      },
      include: {
        sets: {
          orderBy: {
            position: "asc",
          },
        },
      },
    })
  }
  async syncSeries() {
    const response = await fetch("https://api.tcgdex.net/v2/fr/series")
    const series = await response.json()

    await this.prisma.$transaction(
      series.map((serie, index) =>
        this.prisma.series.upsert({
          where: { id: serie.id },
          update: {
            name: serie.name,
            logo: serie.logo,
            position: index,
          },
          create: {
            id: serie.id,
            name: serie.name,
            logo: serie.logo,
            position: index,
          },
        }),
      ),
    )
  }
}
