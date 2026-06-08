import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import { useParams } from "react-router"
import CardModifyModal from "../components/CardModifyModal"
import extension_fallback from "../assets/pokemon-trading-card-game-logo.png"
import { Loader2, ScanLine } from "lucide-react"
import { useState } from "react"
import ScanPageModal from "../components/ScanPageModal"

const ExtensionTcg = () => {
  const { id } = useParams()
  const [scanOpen, setScanOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["Extension"],
    queryFn: async () => await apiService.getCard(id ?? ""),
  })

  const isBaseSet = data?.id === "base1" || data?.id === "base2"

  if (isLoading)
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader2 size={90} className="animate-spin" />
      </div>
    )

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-5">
        <h2 className="my-6 text-3xl font-bold">{data?.name}</h2>
        <img
          src={`${data?.symbol}.png`}
          className="h-4"
          onError={(e) => {
            e.currentTarget.src = extension_fallback
            e.currentTarget.onerror = null
          }}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {data?.cards.map((card, index) => (
          <CardModifyModal key={index} card={card} isBaseSet={isBaseSet} />
        ))}
      </div>

      {/* FAB scan */}
      <button
        onClick={() => setScanOpen(true)}
        className="fixed right-6 bottom-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 shadow-lg transition-transform hover:bg-indigo-500 active:scale-95"
      >
        <ScanLine size={24} />
      </button>

      {scanOpen && <ScanPageModal setId={id ?? ""} isBaseSet={isBaseSet} existingCards={data?.cards ?? []} onClose={() => setScanOpen(false)} />}
    </div>
  )
}

export default ExtensionTcg
