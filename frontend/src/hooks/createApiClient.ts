import type { AxiosError, AxiosInstance } from "axios"
import axios from "axios"
import { toast } from "react-toastify"
import { Capacitor } from "@capacitor/core"

export type ApiResponse = {
  timestamp: string
  path: string
  message: string
}

export function createApiClient() {
  const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_URL,
    timeout: 60_000,
    headers: {
      "Content-Type": "application/json",
    },
    withCredentials: true,
  })

  api.interceptors.request.use((config) => {
    const isNative = Capacitor.isNativePlatform()
    const token = localStorage.getItem("access_token")
    if (isNative && token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiResponse>) => {
      if (Capacitor.isNativePlatform()) {
      }
      toast.error(error?.response?.data?.message || "Erreur réseau ou serveur")
      return Promise.reject(error)
    },
  )

  return api
}
