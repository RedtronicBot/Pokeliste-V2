import { createApiClient } from "../hooks/createApiClient"
import type { Card, OwnedVariant, Series, SetModel } from "../types"

const api = createApiClient()
export const apiService = {
  getCard: async (id: string): Promise<Card[]> => {
    const { data } = await api.get(`card/set/${id}`)
    return data
  },
  updateVariant: async (id: string, dataVariant: Omit<OwnedVariant, "id" | "cardId">): Promise<OwnedVariant> => {
    const { data } = await api.post(`card/${id}`, dataVariant)
    return data
  },
  getSet: async (): Promise<SetModel[]> => {
    const { data } = await api.get("set")
    return data
  },
  getSeries: async (): Promise<Series[]> => {
    const { data } = await api.get("series")
    return data
  },
}
