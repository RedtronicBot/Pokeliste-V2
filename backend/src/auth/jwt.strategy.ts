import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, ExtractJwt } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { Request } from "express"
import { AuthService } from "./auth.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.access_token ?? null, // Web → cookie
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Mobile → header
      ]),
      secretOrKey: config.get("JWT_SECRET"),
    })
  }

  async validate(payload: any) {
    return this.authService.findById(payload.sub)
  }
}
