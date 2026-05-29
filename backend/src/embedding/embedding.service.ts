// src/embedding/embedding.service.ts

import { Injectable, Logger } from "@nestjs/common"
import sharp from "sharp"
import * as fs from "fs/promises"
import * as path from "path"
import { PrismaService } from "prisma/prisma.service"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

// Un embedding c'est simplement un objet { cardId → hash }
// Le hash est une string hexadécimale de 16 caractères (= 64 bits)
// ex: { "swsh1-1": "a4f3c2b1e8d79f20" }
type SetEmbeddings = Record<string, string>

@Injectable()
export class EmbeddingService {
  // Logger NestJS : affiche des messages préfixés [EmbeddingService] dans la console
  private readonly logger = new Logger(EmbeddingService.name)

  // Dossier où on va stocker les fichiers JSON d'embeddings
  // __dirname = le dossier du fichier compilé (dist/embedding/)
  // on remonte à la racine du projet pour mettre les fichiers dans /embeddings/
  private readonly embeddingsDir = path.join(__dirname, "..", "..", "embeddings")

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // 1. Calcul du pHash d'une image
  // ─────────────────────────────────────────────

  // Cette fonction prend un Buffer (données binaires d'une image)
  // et retourne une string hexadécimale de 16 caractères (64 bits)
  private async computePhash(imageBuffer: Buffer): Promise<string> {
    // Étape 1 : Réduire l'image à 32x32 pixels en niveaux de gris
    // - resize(32, 32) : force les dimensions exactes sans garder le ratio
    // - grayscale() : convertit en niveaux de gris (1 valeur par pixel au lieu de 3 RGB)
    // - raw() : retourne les pixels bruts sans en-tête PNG/JPEG
    // - toBuffer() : retourne un Buffer Node.js
    const { data } = await sharp(imageBuffer).resize(32, 32, { fit: "fill" }).grayscale().raw().toBuffer({ resolveWithObject: true })

    // data est maintenant un Buffer de 1024 bytes (32*32)
    // chaque byte = valeur 0-255 représentant la luminosité d'un pixel

    // Étape 2 : Appliquer une DCT (Discrete Cosine Transform) simplifiée
    // La DCT complète sur 32x32 puis réduction à 8x8 est coûteuse
    // On utilise une approche simplifiée mais suffisante :
    // on fait une moyenne de blocs 4x4 pour obtenir une grille 8x8
    const SIZE = 32
    const BLOCK = 4 // 32/8 = 4 pixels par bloc
    const dctGrid: number[] = []

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        // Pour chaque cellule de la grille 8x8,
        // on calcule la moyenne des pixels du bloc 4x4 correspondant
        let sum = 0
        for (let r = 0; r < BLOCK; r++) {
          for (let c = 0; c < BLOCK; c++) {
            const pixelIndex = (row * BLOCK + r) * SIZE + (col * BLOCK + c)
            sum += data[pixelIndex]
          }
        }
        dctGrid.push(sum / (BLOCK * BLOCK)) // moyenne du bloc
      }
    }
    // dctGrid est maintenant un tableau de 64 valeurs (8x8)

    // Étape 3 : Calculer la moyenne de ces 64 valeurs
    const mean = dctGrid.reduce((a, b) => a + b, 0) / dctGrid.length

    // Étape 4 : Convertir en bits
    // Chaque valeur > moyenne → 1, sinon → 0
    // Résultat : 64 bits qui capturent la structure visuelle de l'image
    const bits = dctGrid.map((v) => (v > mean ? 1 : 0))

    // Étape 5 : Convertir les 64 bits en string hexadécimale
    // On regroupe les bits par 4 (un nibble = un caractère hex)
    // ex: [1,0,1,0] → 10 en décimal → "a" en hex
    let hex = ""
    for (let i = 0; i < 64; i += 4) {
      const nibble = bits[i] * 8 + bits[i + 1] * 4 + bits[i + 2] * 2 + bits[i + 3]
      hex += nibble.toString(16) // toString(16) = conversion en hexadécimal
    }

    return hex // ex: "a4f3c2b1e8d79f20"
  }

  // ─────────────────────────────────────────────
  // 2. Distance de Hamming entre deux hashs
  // ─────────────────────────────────────────────

  // Compte le nombre de bits différents entre deux hashs
  // C'est une méthode statique car elle ne dépend d'aucun état du service
  static hammingDistance(hashA: string, hashB: string): number {
    let distance = 0
    for (let i = 0; i < hashA.length; i++) {
      // On compare chaque caractère hex
      // Si différent, on compte combien de bits diffèrent entre les deux nibbles
      if (hashA[i] !== hashB[i]) {
        // XOR entre les deux valeurs hex → les bits différents valent 1
        const xor = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16)
        // On compte le nombre de 1 dans le résultat du XOR
        // ex: 0b1010 XOR 0b1100 = 0b0110 → 2 bits différents
        distance += xor.toString(2).split("1").length - 1
      }
    }
    return distance
  }

  // ─────────────────────────────────────────────
  // 3. Générer les embeddings d'un set complet
  // ─────────────────────────────────────────────

  async generateSetEmbeddings(setId: string): Promise<void> {
    // S'assurer que le dossier /embeddings/ existe
    // recursive: true = pas d'erreur si le dossier existe déjà
    await fs.mkdir(this.embeddingsDir, { recursive: true })

    const filePath = path.join(this.embeddingsDir, `${setId}.json`)

    // Si le fichier existe déjà, pas besoin de recalculer
    try {
      await fs.access(filePath)
      this.logger.log(`Embeddings déjà générés pour ${setId}`)
      return
    } catch {
      // Le fichier n'existe pas, on continue
    }

    // Récupérer toutes les cartes du set depuis la DB
    const cards = await this.prisma.card.findMany({
      where: { setId },
      select: { id: true, image: true },
    })

    this.logger.log(`Génération des embeddings pour ${cards.length} cartes du set ${setId}`)

    const embeddings: SetEmbeddings = {}
    let success = 0
    let failed = 0

    for (const card of cards) {
      try {
        const response = await fetch(`${card.image}/high.webp`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        // response.arrayBuffer() récupère le contenu binaire de l'image
        // Buffer.from() le convertit en Buffer Node.js (ce que Sharp attend)
        const buffer = Buffer.from(await response.arrayBuffer())

        // Calculer le hash et le stocker
        embeddings[card.id] = await this.computePhash(buffer)
        success++
      } catch (error) {
        // Si une carte échoue, on log mais on continue les autres
        const message = error instanceof Error ? error.message : String(error)
        this.logger.warn(`Échec embedding carte ${card.id}: ${message}`)
        failed++
      }
    }

    // Sauvegarder le JSON
    // JSON.stringify(obj, null, 2) = formatage indenté pour lisibilité
    await fs.writeFile(filePath, JSON.stringify(embeddings, null, 2), "utf-8")

    this.logger.log(`Embeddings sauvegardés: ${success} OK, ${failed} échecs → ${filePath}`)
  }

  // ─────────────────────────────────────────────
  // 4. Charger les embeddings d'un set depuis le fichier
  // ─────────────────────────────────────────────

  async loadSetEmbeddings(setId: string): Promise<SetEmbeddings> {
    const filePath = path.join(this.embeddingsDir, `${setId}.json`)
    const content = await fs.readFile(filePath, "utf-8")
    return JSON.parse(content)
  }

  // ─────────────────────────────────────────────
  // 5. Trouver la carte la plus proche d'un hash donné
  // ─────────────────────────────────────────────

  findBestMatch(
    queryHash: string,
    embeddings: SetEmbeddings,
    topN = 3,
  ): Array<{ cardId: string; distance: number; confidence: "high" | "medium" | "low" }> {
    // Calculer la distance entre le hash query et tous les hashs du set
    const results = Object.entries(embeddings).map(([cardId, hash]) => ({
      cardId,
      distance: EmbeddingService.hammingDistance(queryHash, hash),
    }))

    // Trier par distance croissante (le plus proche en premier)
    results.sort((a, b) => a.distance - b.distance)

    // Retourner les N meilleurs avec un niveau de confiance
    return results.slice(0, topN).map((r) => ({
      ...r,
      confidence: r.distance <= 10 ? "high" : r.distance <= 20 ? "medium" : "low",
    }))
  }
  async comparePhoto(
    imageBase64: string,
    setId: string,
  ): Promise<{
    results: Array<{ cardId: string; distance: number; confidence: "high" | "medium" | "low" }>
    bestMatch: { cardId: string; distance: number; confidence: "high" | "medium" | "low" } | null
  }> {
    // Étape 1 : Nettoyer le base64
    // L'app peut envoyer "data:image/jpeg;base64,/9j/..." ou juste "/9j/..."
    // On enlève le préfixe si présent
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64

    // Convertir le base64 en Buffer Node.js
    // Buffer.from(string, "base64") décode le base64 en bytes binaires
    const imageBuffer = Buffer.from(base64Data, "base64")

    // Étape 2 : Calculer le hash de la photo
    const queryHash = await this.computePhash(imageBuffer)
    this.logger.log(`Hash photo: ${queryHash}`)

    // Étape 3 : Charger les embeddings du set
    // Si le fichier n'existe pas, generateSetEmbeddings le créera
    await this.generateSetEmbeddings(setId)
    const embeddings = await this.loadSetEmbeddings(setId)

    // Étape 4 : Trouver les meilleures correspondances
    const results = this.findBestMatch(queryHash, embeddings, 3)

    this.logger.log(`Meilleur match: ${results[0]?.cardId} (distance: ${results[0]?.distance})`)

    return {
      results,
      // bestMatch = null si même le meilleur résultat est trop loin (confiance low)
      bestMatch: results[0]?.confidence !== "low" ? results[0] : null,
    }
  }
}
