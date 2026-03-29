import { createApiClient } from "../hooks/createApiClient"
import type { OwnedVariant, Series, SetModel } from "../types"

const api = createApiClient()
export const apiService = {
  getCard: async (id: string): Promise<SetModel> => {
    const { data } = await api.get(`set/${id}`)
    return data
  },
  updateVariant: async (id: string, dataVariant: Omit<OwnedVariant, "id" | "cardId">): Promise<OwnedVariant> => {
    const { data } = await api.post(`card/${id}`, dataVariant)
    return data
  },
  getSeries: async (): Promise<Series[]> => {
    const { data } = await api.get("series")
    return data
  },
}
