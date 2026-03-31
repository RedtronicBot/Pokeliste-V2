import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import extension_fallback from "../assets/pokemon-trading-card-game-logo.png"
import { Link } from "react-router"
const Dashboard = () => {
  const { data } = useQuery({
    queryKey: ["Sets"],
    queryFn: async () => await apiService.getSeries(),
  })
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12">
      <h1 className="mb-8 text-4xl font-black tracking-tight md:text-5xl">Extention Pokémon Trading Card Game</h1>
      <div className="flex flex-col">
        {data
          ?.filter((series) => series.id !== "tcgp" && series.id !== "mc")
          .map((series) => (
            <div key={series.id} className="bg-secondary mb-12 rounded-xl border border-slate-700 p-8">
              <h2 className="mb-6 text-3xl font-bold">{series.name}</h2>

              <div className="grid grid-cols-2 gap-6">
                {series.sets.map((set) => (
                  <Link to={`/ptcg/${set.id}`} key={set.id}>
                    <div className="bg-tertiary group expansion-card relative flex max-h-44 cursor-pointer flex-col items-center rounded-xl border border-slate-500 p-4 transition-all duration-300">
                      <div className="mb-2 flex w-full items-start justify-between">
                        <p className="text-xl font-bold">{set.name}</p>
                      </div>
                      <img
                        className="absolute -top-2 -right-2 h-7"
                        src={`${set.symbol}.png`}
                        onError={(e) => {
                          e.currentTarget.src = extension_fallback
                          e.currentTarget.onerror = null
                        }}
                      />
                      <img
                        className="max-h-30"
                        src={`${set.logo}.png`}
                        onError={(e) => {
                          e.currentTarget.src = extension_fallback
                          e.currentTarget.onerror = null
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default Dashboard
