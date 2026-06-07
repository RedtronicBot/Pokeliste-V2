import { useState } from "react"
import { X, CheckCheck, Settings } from "lucide-react"
import { takeCardPhoto } from "../hooks/useCamera"
import { apiService } from "../services/apiService"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Card } from "../types"
import CardModifyModal from "./CardModifyModal"

interface ScanResult {
  position: number
  match: {
    cardId: string
    goodMatches: number
    confidence: "high" | "medium" | "low"
  } | null
}

interface Props {
  setId: string
  isBaseSet: boolean
  existingCards: Card[]
  onClose: () => void
}

type Step = "idle" | "scanning" | "results" | "manual"

export default function ScanPageModal({ setId, isBaseSet, existingCards, onClose }: Props) {
  const [step, setStep] = useState<Step>("idle")
  const [preview, setPreview] = useState<string>()
  const [results, setResults] = useState<ScanResult[]>([])
  const [manualCards, setManualCards] = useState<Card[]>([])
  const queryClient = useQueryClient()

  // Cartes déjà possédées
  const ownedCardIds = new Set(existingCards.filter((c) => c.ownedVariant).map((c) => c.id))

  const { mutate: scanPage, isPending } = useMutation({
    mutationFn: ({ image, setId }: { image: string; setId: string }) => apiService.compareCardPage(image, setId),
    onSuccess: (data) => {
      setResults(data.cards)
      setStep("results")
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
  })

  async function handleScan() {
    setStep("scanning")
    const photo = await takeCardPhoto()
    setPreview(photo.preview)
    scanPage({ image: photo.base64, setId })
  }

  // Filtre les résultats exploitables
  const validResults = results.filter((r) => r.match && r.match.confidence !== "low" && !ownedCardIds.has(r.match.cardId))

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
