import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PassportStrategy } from "@nestjs/passport"
import { Profile, Strategy } from "passport-discord-auth"
import { AuthService } from "./auth.service"
@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, "discord") {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientId: configService.get("DISCORD_CLIENT_ID")!,
      clientSecret: configService.get("DISCORD_CLIENT_SECRET")!,
      callbackUrl: configService.get("DISCORD_REDIRECT_URI")!,
      scope: ["identify"],
    })
  }
  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    return this.authService.findOrCreateFromDiscord(profile)
  }
}
