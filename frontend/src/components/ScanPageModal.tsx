import { useState, useCallback } from "react"
import { X, CheckCheck, Settings, Crop as CropIcon } from "lucide-react"
import Cropper, { type Area } from "react-easy-crop"
import { takeCardPhoto } from "../hooks/useCamera"
import { apiService } from "../services/apiService"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Card, ScanResult } from "../types"
import CardModifyModal from "./CardModifyModal"
import { cropImageToBase64, type CropPixelArea } from "../utils/cropImage"

// Ratio d'une grille 3x3 de cartes = ratio d'une carte seule (2.5cm / 3.5cm).
// Doit rester cohérent avec CARD_ASPECT_RATIO côté backend (page_matcher.py).
const PAGE_ASPECT_RATIO = 2.5 / 3.5

interface Props {
  setId: string
  isBaseSet: boolean
  existingCards: Card[]
  onClose: () => void
}

type Step = "idle" | "cropping" | "scanning" | "results" | "manual"

export default function ScanPageModal({ setId, isBaseSet, existingCards, onClose }: Props) {
  const [step, setStep] = useState<Step>("idle")
  const [preview, setPreview] = useState<string>()
  const [rawPhoto, setRawPhoto] = useState<string>() // photo brute (data URL), avant recadrage
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<CropPixelArea>()
  const [manualCards, setManualCards] = useState<Card[]>([])
  const [validResults, setValidResults] = useState<ScanResult[]>([])
  const queryClient = useQueryClient()

  const ownedCardIds = new Set(existingCards.filter((c) => c.ownedVariant).map((c) => c.id))

  const { mutate: scanPage, isPending } = useMutation({
    mutationFn: ({ image, setId }: { image: string; setId: string }) => apiService.compareCardPage(image, setId),
    onSuccess: (data: { cards: ScanResult[] }) => {
      const valid = data.cards.filter((r: ScanResult) => r.match && r.match.confidence !== "low" && !ownedCardIds.has(r.match.cardId))
      setValidResults(valid)
      setStep("results")
    },
    onError: (err) => {
      console.error("onError appelé:", err)
    },
  })

  const { mutate: addCard } = useMutation({
    mutationFn: ({ cardId }: { cardId: string }) =>
      apiService.updateVariant(cardId, {
        normal: 1,
        holo: 0,
        reverse: 0,
        firstEdition: 0,
        secondEdition: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["Extension"] })
    },
    onError: (err) => {
      console.error("Erreur ajout carte:", err)
    },
  })

  async function handleScan() {
    const photo = await takeCardPhoto()
    setRawPhoto(photo.preview)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setStep("cropping")
  }

  const onCropComplete = useCallback((_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  async function handleConfirmCrop() {
    if (!rawPhoto || !croppedArea) return
    setStep("scanning")
    const croppedBase64 = await cropImageToBase64(rawPhoto, croppedArea)
    setPreview(`data:image/jpeg;base64,${croppedBase64}`)
    scanPage({ image: croppedBase64, setId })
  }

  function handleAutoAdd() {
    validResults.forEach((r) => {
      if (r.match) addCard({ cardId: r.match.cardId })
    })
    onClose()
  }

  function handleManual() {
    const cards = validResults.map((r) => existingCards.find((c) => c.id === r.match?.cardId)).filter(Boolean) as Card[]
    setManualCards(cards)
    setStep("manual")
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-gray-950/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <h2 className="text-lg font-bold">Scanner une page</h2>
        <X onClick={onClose} className="cursor-pointer" />
      </div>

      <div className="flex flex-col items-center gap-6 p-4">
        {/* Étape idle */}
        {step === "idle" && (
          <button onClick={handleScan} className="mt-10 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold hover:bg-indigo-500">
            Prendre une photo
          </button>
        )}

        {/* Étape crop : ajuster le cadre sur la page du classeur avant envoi */}
        {step === "cropping" && rawPhoto && (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-center text-sm text-slate-300">Cale le cadre sur les 9 cartes de la page, puis valide</p>
            <div className="relative h-[60vh] w-full max-w-md">
              <Cropper
                image={rawPhoto}
                crop={crop}
                zoom={zoom}
                aspect={PAGE_ASPECT_RATIO}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full max-w-md"
            />
            <div className="flex gap-3">
              <button onClick={() => setStep("idle")} className="rounded-lg bg-slate-700 px-4 py-2 font-bold hover:bg-slate-600">
                Reprendre la photo
              </button>
              <button
                onClick={handleConfirmCrop}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold hover:bg-indigo-500"
              >
                <CropIcon size={18} />
                Valider le cadrage
              </button>
            </div>
          </div>
        )}

        {/* Scanning en cours */}
        {step === "scanning" && (
          <div className="mt-10 flex flex-col items-center gap-4">
            {preview && <img src={preview} className="max-w-xs rounded-lg" />}
            <p className="animate-pulse text-slate-400">{isPending ? "Analyse en cours..." : "Photo prise, envoi..."}</p>
          </div>
        )}

        {/* Résultats */}
        {step === "results" && (
          <div className="flex w-full flex-col items-center gap-4">
            {preview && <img src={preview} className="max-w-xs rounded-lg" />}

            {validResults.length === 0 ? (
              <p className="text-slate-400">Aucune carte identifiable trouvée.</p>
            ) : (
              <>
                <p className="text-slate-300">
                  <span className="font-bold text-white">{validResults.length}</span> carte(s) détectée(s)
                </p>

                {/* Liste des cartes trouvées */}
                <div className="flex w-full flex-wrap justify-center gap-3">
                  {validResults.map((r) => {
                    const card = existingCards.find((c) => c.id === r.match?.cardId)
                    if (!card) return null
                    return (
                      <div key={r.position} className="flex flex-col items-center gap-1">
                        <img src={`${card.image}/low.png`} className="h-32 rounded" />
                        <span className="text-xs text-slate-400">{card.name}</span>
                        <span className={`text-xs font-bold ${r.match?.confidence === "high" ? "text-green-400" : "text-yellow-400"}`}>
                          {r.match?.confidence}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="mt-2 flex gap-3">
                  <button onClick={handleAutoAdd} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-bold hover:bg-green-500">
                    <CheckCheck size={18} />
                    Auto
                  </button>
                  <button onClick={handleManual} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-bold hover:bg-indigo-500">
                    <Settings size={18} />
                    Manuel
                  </button>
                </div>

                <button onClick={handleScan} className="text-sm text-slate-400 underline hover:text-white">
                  Rescanner
                </button>
              </>
            )}
          </div>
        )}

        {/* Étape manuelle — ouvre les modales carte par carte */}
        {step === "manual" && (
          <div className="flex w-full flex-col items-center gap-4">
            <p className="text-slate-300">Modifie chaque carte puis ferme la modale</p>
            <div className="flex flex-wrap justify-center gap-6">
              {manualCards.map((card) => (
                <CardModifyModal key={card.id} card={card} isBaseSet={isBaseSet} />
              ))}
            </div>
            <button onClick={onClose} className="mt-4 rounded-lg bg-indigo-600 px-6 py-2 font-bold hover:bg-indigo-500">
              Terminer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
