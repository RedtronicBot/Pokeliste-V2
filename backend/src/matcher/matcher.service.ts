import { Injectable, Logger } from "@nestjs/common"
import { spawn } from "child_process"
import * as path from "path"
import * as fs from "fs/promises"
import * as os from "os"

type CardMatch = {
  cardId: string
  goodMatches: number
  confidence: "high" | "medium" | "low"
} | null

type ScanResult = {
  position: number
  match: CardMatch
}

type PageMatchResult = {
  cards: ScanResult[]
  error?: string
}

@Injectable()
export class MatcherService {
  private readonly logger = new Logger(MatcherService.name)
  private readonly imagesDir = path.join(process.cwd(), "images")

  async matchPage(imageBase64: string, setId: string): Promise<PageMatchResult> {
    const setImagesDir = path.join(this.imagesDir, setId)
    const pageScript = path.join(process.cwd(), "python", "page_matcher.py")

    const tmpFile = path.join(os.tmpdir(), `page-${Date.now()}.txt`)
    await fs.writeFile(tmpFile, imageBase64, "utf-8")

    const pythonCmd = process.platform === "win32" ? "py" : "python3"
    const pythonArgs = process.platform === "win32" ? ["-3.14", pageScript, tmpFile, setImagesDir] : [pageScript, tmpFile, setImagesDir]
    const start = Date.now()

    return new Promise<PageMatchResult>((resolve, reject) => {
      const python = spawn(pythonCmd, pythonArgs)

      let output = ""
      let errorOutput = ""

      python.stdout.on("data", (data) => {
        output += data.toString()
      })
      python.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      python.on("close", async (code) => {
        this.logger.log(`Temps page: ${Date.now() - start}ms`)
        await fs.unlink(tmpFile).catch(() => {})

        if (code !== 0) {
          this.logger.error(`Python page error: ${errorOutput}`)
          reject(new Error(`Script Python échoué: ${errorOutput}`))
          return
        }
        try {
          resolve(JSON.parse(output) as PageMatchResult)
        } catch {
          reject(new Error(`Réponse Python invalide: ${output}`))
        }
      })
    })
  }
}
