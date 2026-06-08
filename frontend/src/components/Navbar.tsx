import { Link } from "react-router"
import pokeliste_logo from "../assets/logo.png"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import discordIcon from "../assets/discord_icon_195948.png"
import { Capacitor } from "@capacitor/core"
import { Browser } from "@capacitor/browser"
import { Menu, X } from "lucide-react"
import { useState } from "react"

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const login = () => {
    if (Capacitor.isNativePlatform()) {
      Browser.open({
        url: `${import.meta.env.VITE_URL}/auth/discord?platform=mobile`,
      })
    } else {
      window.location.href = `${import.meta.env.VITE_URL}/auth/discord`
    }
  }

  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: apiService.getDiscordMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const { mutate: logout } = useMutation({
    mutationFn: apiService.getDiscordLogout,
    onSuccess: () => {
      // Vide le localStorage sur mobile
      localStorage.removeItem("access_token")
      queryClient.setQueryData(["me"], null)

      // Redirige sur web uniquement
      if (!Capacitor.isNativePlatform()) {
        window.location.href = import.meta.env.VITE_FRONT_URL ?? "/"
      }
    },
  })

  const navLinks = [
    { to: "/", label: "Pokemon TCG" },
    { to: "/ptcgp", label: "Pokemon TCG Pocket" },
    { to: "/stats", label: "Statistiques" },
  ]

  return (
    <>
      <div className="flex h-16 w-full items-center justify-between px-6">
        <img src={pokeliste_logo} className="h-13" />

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} className="hover:text-hover-text text-sm text-slate-400 transition-colors" to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Auth */}
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-slate-700" />
          ) : user ? (
            <div
              className="bg-secondary hover:bg-secondary/70 flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 select-none"
              onClick={() => logout()}
            >
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.webp?size=64`}
                  className="h-8 w-8 rounded-full"
                  alt={user.username}
                />
              )}
              <span className="hidden text-sm text-slate-400 md:block">{user.username}</span>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-500"
            >
              <img src={discordIcon} className="h-4" />
              <span className="hidden md:block">Connexion</span>
            </button>
          )}

          {/* Burger mobile */}
          <button className="p-1 text-slate-400 hover:text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile déroulant */}
      {menuOpen && (
        <div className="bg-primary/95 flex flex-col border-t border-slate-800 backdrop-blur-md md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              className="border-b border-slate-800/50 px-6 py-4 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              to={link.to}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

export default Navbar
