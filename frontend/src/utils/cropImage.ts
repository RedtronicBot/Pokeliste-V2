export interface CropPixelArea {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Découpe `imageSrc` (data URL) selon `cropArea` (en pixels, fournie par react-easy-crop)
 * et renvoie une nouvelle image base64 (sans le préfixe "data:image/...;base64,").
 */
export async function cropImageToBase64(imageSrc: string, cropArea: CropPixelArea, quality = 0.85): Promise<string> {
  const image = await loadImage(imageSrc)

  const canvas = document.createElement("canvas")
  canvas.width = cropArea.width
  canvas.height = cropArea.height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Impossible de créer le contexte canvas")
  }

  ctx.drawImage(image, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, cropArea.width, cropArea.height)

  const dataUrl = canvas.toDataURL("image/jpeg", quality)
  return dataUrl.split(",")[1]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Impossible de charger l'image à découper"))
    img.src = src
  })
}
