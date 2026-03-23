import type { AxiosError, AxiosInstance } from "axios"
import axios from "axios"
import { toast } from "react-toastify"

export type ApiResponse = {
  timestamp: string
  path: string
  message: string
}

export function createApiClient() {
  const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_URL,
    timeout: 10_000,
    headers: {
      "Content-Type": "application/json",
    },
  })

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
      toast.error(error?.response?.data?.message || "Erreur réseau ou serveur")
      return Promise.reject(error)
    },
  )
  return api
}
