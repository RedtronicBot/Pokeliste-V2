import { createApiClient } from "../hooks/createApiClient"
import type { DiscordUser, OwnedVariant, RawCard, RawSetModel, Series, SetModel } from "../types"

const api = createApiClient()
export const apiService = {
  getCard: async (id: string): Promise<SetModel> => {
    const { data } = await api.get<RawSetModel>(`set/${id}`)
    return {
      ...data,
      cards: data.cards.map((card: RawCard) => ({
        ...card,
        ownedVariant: card.ownedVariants?.[0] ?? null,
      })),
    }
  },
  updateVariant: async (id: string, dataVariant: Omit<OwnedVariant, "id" | "cardId">): Promise<OwnedVariant> => {
    const { data } = await api.post(`card/${id}`, dataVariant)
    return data
  },
  getSeries: async (): Promise<Series[]> => {
    const { data } = await api.get("series")
    return data
  },
  getDiscordMe: async (): Promise<DiscordUser | null> => {
    const { data } = await api.get("auth/me")
    return data
  },
  getDiscordLogout: async () => {
    return await api.post("auth/logout")
  },
  getStats: async () => {
    const { data } = await api.get("stats")
    return data
  },
  compareCard: async (image: string, setId: string) => {
    const { data } = await api.post("matcher/compare", {
      image,
      setId,
    })

    return data
  },
  compareCardPage: async (image: string, setId: string) => {
    const { data } = await api.post("matcher/compare-page", {
      image,
      setId,
    })
    return data
  },
}
