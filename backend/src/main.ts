import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
