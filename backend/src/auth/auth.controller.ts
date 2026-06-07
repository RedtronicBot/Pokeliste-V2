import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Response } from "express"
import { AuthService } from "./auth.service"
import { AuthGuard } from "@nestjs/passport"
import { DiscordAuthGuard } from "./guards/dynamic_discord.guard"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Get("discord")
  @UseGuards(DiscordAuthGuard)
  discordLogin(@Req() req) {}

  @Get("discord/callback")
  @UseGuards(AuthGuard("discord"))
  async discordCallback(@Req() req, @Res() res: Response) {
    const jwt = await this.authService.signJwt(req.user)
    console.log("JWT généré:", jwt ? "oui" : "non")
    console.log("Headers de la requête:", req.headers.origin)
    // Discord renvoie le state dans req.query
    const state = req.query.state as string
    let isMobile = false

    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString())
      isMobile = parsed.platform === "mobile"
    } catch {
      // state absent ou malformé → on reste sur web
    }
    console.log("isMobile:", isMobile)
    const redirectUrl = isMobile ? `${this.configService.get("MOBILE_DEEPLINK")}?token=${jwt}` : `${this.configService.get("FRONT_URL")}/auth/success`

    // Cookie pour le web (ignoré sur mobile mais inoffensif)
    res.cookie("access_token", jwt, {
      httpOnly: true,
      secure: this.configService.get("NODE_ENV") === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    console.log("Cookie set, redirection vers:", redirectUrl)
    return res.redirect(redirectUrl)
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  getMe(@Req() req) {
    return req.user
  }

  @Post("logout")
  logout(@Res() res: Response) {
    res.clearCookie("access_token", { path: "/" })
    res.redirect(this.configService.get("FRONT_URL")!)
  }
}
