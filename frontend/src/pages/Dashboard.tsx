import SeriesGrid from "../components/SeriesGrid"
const Dashboard = () => {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center lg:px-6 lg:py-12">
      <h1 className="mb-8 text-4xl font-black tracking-tight md:text-3xl">Extension Pokémon Trading Card Game</h1>
      <SeriesGrid filter="other" grouped />
    </div>
  )
}

export default Dashboard
