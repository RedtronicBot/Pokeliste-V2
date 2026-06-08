import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import { Loader2 } from "lucide-react"
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Legend } from "recharts"

type StatsData = {
  id: string
  name: string
  sets: {
    id: string
    name: string
    cardCount: number
    ownedCount: number
    variants: {
      normal: number
      holo: number
      reverse: number
      firstEdition: number
      secondEdition: number
    }
  }[]
}[]

type BarShapeProps = {
  x: number
  y: number
  width: number
  height: number
  index: number
}

const VARIANT_COLORS = {
  normal: "#6366f1",
  holo: "#f59e0b",
  reverse: "#10b981",
  firstEdition: "#ef4444",
  secondEdition: "#8b5cf6",
}

const COMPLETION_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"]

export default function Stats() {
  const { data, isLoading, isFetching } = useQuery<StatsData>({
    queryKey: ["stats"],
    queryFn: () => apiService.getStats(),
  })

  if (isLoading || isFetching) {
    return (
      <div className="flex h-dvh w-full items-center justify-center">
        <Loader2 size={90} className="animate-spin" />
      </div>
    )
  }

  if (!data) return null

  // --- Calculs globaux ---
  const totalCards = data.reduce((acc, s) => acc + s.sets.reduce((a, set) => a + set.cardCount, 0), 0)
  const totalOwned = data.reduce((acc, s) => acc + s.sets.reduce((a, set) => a + set.ownedCount, 0), 0)
  const completionPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0

  const totalVariants = data.reduce(
    (acc, s) =>
      s.sets.reduce((a, set) => {
        a.normal += set.variants.normal
        a.holo += set.variants.holo
        a.reverse += set.variants.reverse
        a.firstEdition += set.variants.firstEdition
        a.secondEdition += set.variants.secondEdition
        return a
      }, acc),
    { normal: 0, holo: 0, reverse: 0, firstEdition: 0, secondEdition: 0 },
  )
  const totalVariantCount =
    totalVariants.normal + totalVariants.holo + totalVariants.reverse + totalVariants.firstEdition + totalVariants.secondEdition

  const variantPieData = [
    { name: "Normal", value: totalVariants.normal, fill: VARIANT_COLORS.normal },
    { name: "Holo", value: totalVariants.holo, fill: VARIANT_COLORS.holo },
    { name: "Reverse", value: totalVariants.reverse, fill: VARIANT_COLORS.reverse },
    { name: "1ère édition", value: totalVariants.firstEdition, fill: VARIANT_COLORS.firstEdition },
    { name: "2nde édition", value: totalVariants.secondEdition, fill: VARIANT_COLORS.secondEdition },
  ].filter((v) => v.value > 0)

  // Top 5 extensions les plus complétées (avec au moins 1 carte possédée)
  const allSets = data.flatMap((s) => s.sets.map((set) => ({ ...set, seriesName: s.name })))
  const top5Sets = [...allSets]
    .filter((s) => s.ownedCount > 0)
    .sort((a, b) => b.ownedCount / b.cardCount - a.ownedCount / a.cardCount)
    .slice(0, 5)

  // Complétion par série (barres horizontales)
  const seriesCompletion = data
    .map((s) => {
      const totalC = s.sets.reduce((a, set) => a + set.cardCount, 0)
      const totalO = s.sets.reduce((a, set) => a + set.ownedCount, 0)
      return {
        name: s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name,
        fullName: s.name,
        owned: totalO,
        total: totalC,
        pct: totalC > 0 ? Math.round((totalO / totalC) * 100) : 0,
      }
    })
    .filter((s) => s.owned > 0)
    .sort((a, b) => b.pct - a.pct)

  const radialData = [{ name: "Progression", value: completionPct, fill: "#6366f1" }]

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-slate-400">Vue d'ensemble de votre collection</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Cartes possédées" value={totalOwned.toLocaleString()} />
        <StatCard label="Total cartes" value={totalCards.toLocaleString()} />
        <StatCard label="Complétion globale" value={`${completionPct}%`} />
        <StatCard label="Exemplaires total" value={totalVariantCount.toLocaleString()} />
      </div>

      {/* Progression + Variantes */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Radial progress */}
        <div className="bg-secondary rounded-xl border border-slate-700 p-6">
          <h2 className="mb-4 text-lg font-semibold">Progression globale</h2>
          <div className="relative flex h-56 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" barSize={16} data={radialData} startAngle={210} endAngle={-30}>
                <RadialBar background={{ fill: "#1e293b" }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{completionPct}%</span>
              <span className="text-sm text-slate-400">
                {totalOwned} / {totalCards}
              </span>
            </div>
          </div>
        </div>

        {/* Pie variantes */}
        <div className="bg-secondary rounded-xl border border-slate-700 p-6">
          <h2 className="mb-4 text-lg font-semibold">Répartition des variantes</h2>
          {variantPieData.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-slate-500">Aucune variante enregistrée</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={variantPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#f1f5f9" }}
                  formatter={(value) => [value]}
                />
                <Legend formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top 5 extensions */}
      {top5Sets.length > 0 && (
        <div className="bg-secondary rounded-xl border border-slate-700 p-6">
          <h2 className="mb-6 text-lg font-semibold">Top 5 — Extensions les plus complétées</h2>
          <div className="space-y-4">
            {top5Sets.map((set, i) => {
              const pct = Math.round((set.ownedCount / set.cardCount) * 100)
              return (
                <div key={set.id} className="flex items-center gap-4">
                  <span className="w-5 text-right text-sm font-bold text-slate-500">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{set.name}</span>
                      <span className="ml-2 shrink-0 text-sm text-slate-400">
                        {set.ownedCount}/{set.cardCount}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: COMPLETION_COLORS[i] ?? "#6366f1",
                        }}
                      />
                    </div>
                  </div>
                  <span className="w-10 text-right text-sm font-bold">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Barchart complétion par série */}
      {seriesCompletion.length > 0 && (
        <div className="bg-secondary rounded-xl border border-slate-700 p-6">
          <h2 className="mb-6 text-lg font-semibold">Complétion par série</h2>
          <ResponsiveContainer width="100%" height={seriesCompletion.length * 44 + 40}>
            <BarChart data={seriesCompletion} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                formatter={(value, _name, props) => [`${value}% — ${props.payload.owned}/${props.payload.total} cartes`, props.payload.fullName]}
                cursor={{ fill: "rgba(99,102,241,0.08)" }}
              />
              <Bar
                dataKey="pct"
                radius={[0, 6, 6, 0]}
                shape={(props: BarShapeProps) => {
                  const { x, y, width, height, index } = props
                  const fill = `hsl(${240 - index * (160 / Math.max(seriesCompletion.length - 1, 1))}, 70%, 60%)`
                  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} ry={6} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary rounded-xl border border-slate-700 p-5">
      <p className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  )
}
