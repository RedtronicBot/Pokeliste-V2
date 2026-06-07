import { Injectable, ExecutionContext } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

@Injectable()
export class DiscordAuthGuard extends AuthGuard("discord") {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    const platform = req.query.platform === "mobile" ? "mobile" : "web"
    const state = Buffer.from(JSON.stringify({ platform })).toString("base64url")
    return { state }
  }
}
