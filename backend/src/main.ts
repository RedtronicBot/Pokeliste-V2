import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import cookieParser from "cookie-parser"
import * as express from "express"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(express.json({ limit: "5mb" }))
  app.use(express.urlencoded({ limit: "5mb", extended: true }))
  app.use(cookieParser())
  app.enableCors({
    origin: [process.env.FRONT_URL],
    methods: ["GET", "PUT", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
