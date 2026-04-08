import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Response } from "express"
import { AuthService } from "./auth.service"
import { AuthGuard } from "@nestjs/passport"

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Get("discord")
  @UseGuards(AuthGuard("discord"))
  discordLogin() {}

  @Get("discord/callback")
  @UseGuards(AuthGuard("discord"))
  async discordCallback(@Req() req, @Res() res: Response) {
    const jwt = await this.authService.signJwt(req.user)
    const frontendUrl = this.configService.get("FRONT_URL")

    res.cookie("access_token", jwt, {
      httpOnly: true,
      secure: this.configService.get("NODE_ENV") === "production",
      sameSite: "lax",
      domain: this.configService.get("COOKIE_DOMAIN") || undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.redirect(`${frontendUrl}/auth/success`)
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
