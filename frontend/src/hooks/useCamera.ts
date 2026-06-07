import { Camera, CameraResultType, CameraSource } from "@capacitor/camera"

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

  return {
    base64: result.base64String,
    preview: `data:image/jpeg;base64,${result.base64String}`,
  }
}
