import { Link } from "react-router"
import pokeliste_logo from "../assets/logo.png"
const Navbar = () => {
  return (
    <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
      <img src={pokeliste_logo} className="h-13" />
      <nav className="flex items-center gap-8">
        <Link className="hover:text-hover-text text-sm text-slate-400 transition-colors" to={"/"}>
          Pokemon TCG
        </Link>
        <Link className="hover:text-hover-text text-sm text-slate-400 transition-colors" to={"/ptcgp"}>
          Pokemon TCG Pocket
        </Link>
        <Link className="hover:text-hover-text text-sm text-slate-400 transition-colors" to={"/stats"}>
          Statistiques
        </Link>
      </nav>
      <div></div>
    </div>
  )
}

export default Navbar
