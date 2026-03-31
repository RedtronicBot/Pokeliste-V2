import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: [process.env.FRONT_URL],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
  await app.listen(process.env.PORT ?? 3000, "0.0.0.0")
}
bootstrap()
