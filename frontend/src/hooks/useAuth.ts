import { useQuery } from "@tanstack/react-query"
import { apiService } from "../services/apiService"

export const useAuth = () => {
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiService.getDiscordMe(),
  })
  return { isAuthenticated: !!user, user }
}
