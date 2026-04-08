import { Link } from "react-router"
import pokeliste_logo from "../assets/logo.png"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import discordIcon from "../assets/discord_icon_195948.png"
const Navbar = () => {
  const login = () => {
    window.location.href = `${import.meta.env.VITE_URL}/auth/discord`
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
    onSuccess: () => queryClient.setQueryData(["me"], null),
  })
  console.log(user)
  return (
    <div className="flex h-16 w-full items-center justify-between px-6">
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
      <div className="flex items-center">
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
            <span className="text-sm text-slate-400">{user.username}</span>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex cursor-pointer items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-indigo-500"
          >
            <img src={discordIcon} className="h-4" />
            Connexion
          </button>
        )}
      </div>
    </div>
  )
}

export default Navbar
