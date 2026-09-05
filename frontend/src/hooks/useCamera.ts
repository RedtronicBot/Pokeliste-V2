import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"

const MAX_WIDTH = 1600
const JPEG_QUALITY = 0.75

function resizeBase64Image(base64: string, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement("canvas")
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Impossible de créer le contexte canvas"))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg", quality)
      resolve(dataUrl.split(",")[1])
    }
    img.onerror = () => reject(new Error("Impossible de charger l'image pour la compression"))
    img.src = `data:image/jpeg;base64,${base64}`
  })
}

export async function takeCardPhoto() {
  const result = await Camera.getPhoto({
    quality: 60, // ← réduit de 90 à 60
    allowEditing: false,
    resultType: CameraResultType.Base64, // ← base64 direct, plus besoin de Filesystem
    source: CameraSource.Camera,
    width: 800, // ← redimensionne à 800px max
    correctOrientation: true,
  })

  if (!result.base64String) {
    throw new Error("Aucune donnée retournée par la caméra")
  }

  const compressedBase64 = await resizeBase64Image(result.base64String, MAX_WIDTH, JPEG_QUALITY)

  return {
    base64: compressedBase64,
    preview: `data:image/jpeg;base64,${compressedBase64}`,
  }
}
