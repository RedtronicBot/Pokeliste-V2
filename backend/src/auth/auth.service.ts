import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "prisma/prisma.service"
import { Profile } from "passport-discord-auth"
import { User } from "prisma/generated/prisma/client"

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async findOrCreateFromDiscord(profile: Profile) {
    const { id, username, avatar } = profile
    const user = await this.prisma.user.upsert({
      where: { discordId: id },
      update: { username, avatar },
      create: {
        discordId: id,
        username,
        avatar,
      },
    })
    return user
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async signJwt(user: User): Promise<string> {
    return this.jwtService.sign({ sub: user.id, username: user.username })
  }
}
