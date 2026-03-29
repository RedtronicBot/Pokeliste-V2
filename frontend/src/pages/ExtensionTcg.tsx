import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import { useParams } from "react-router"
import CardModifyModal from "../components/CardModifyModal"

const ExtensionTcg = () => {
  const { id } = useParams()
  const { data } = useQuery({
    queryKey: ["Extension"],
    queryFn: async () => await apiService.getCard(id ?? ""),
  })
  console.log(data)
  const isBaseSet = data?.id === "base1" || data?.id === "base2"
  return (
    <div className="flex flex-col items-center">
      <h2 className="my-6 text-3xl font-bold">{data?.name}</h2>
      <div className="flex flex-wrap justify-center gap-6">
        {data?.cards.map((card, index) => (
          <CardModifyModal key={index} card={card} isBaseSet={isBaseSet} />
        ))}
      </div>
    </div>
  )
}

export default ExtensionTcg
