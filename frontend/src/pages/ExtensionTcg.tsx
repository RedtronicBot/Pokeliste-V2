import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import { useParams } from "react-router"
import CardModifyModal from "../components/CardModifyModal"
import extension_fallback from "../assets/pokemon-trading-card-game-logo.png"

const ExtensionTcg = () => {
  const { id } = useParams()
  const { data } = useQuery({
    queryKey: ["Extension"],
    queryFn: async () => await apiService.getCard(id ?? ""),
  })
  const isBaseSet = data?.id === "base1" || data?.id === "base2"
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
    </div>
  )
}

export default ExtensionTcg
