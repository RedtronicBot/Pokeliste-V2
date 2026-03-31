import { Route, Routes } from "react-router"
import Dashboard from "./pages/Dashboard"
import Navbar from "./components/Navbar"
import ExtensionTcg from "./pages/ExtensionTcg"

function App() {
  return (
    <div className="bg-primary min-h-screen text-slate-100">
      <header className="bg-primary/80 sticky top-0 z-50 w-full border-b border-slate-800 backdrop-blur-md">
        <Navbar />
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ptcg/:id" element={<ExtensionTcg />} />
      </Routes>
    </div>
  )
}

export default App
