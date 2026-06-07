import { useEffect } from "react"
import { App, type URLOpenListenerEvent } from "@capacitor/app"
import { useNavigate } from "react-router"
import { Browser } from "@capacitor/browser"
import { useQueryClient } from "@tanstack/react-query"
export default function AppUrlListener() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    let listener: { remove: () => void } | undefined

    const setup = async () => {
      listener = await App.addListener("appUrlOpen", async (event: URLOpenListenerEvent) => {
        try {
          const tokenMatch = event.url.match(/[?&]token=([^&]+)/)
          const token = tokenMatch?.[1]

          if (token) {
            await Browser.close()
            localStorage.setItem("access_token", token)
            await queryClient.refetchQueries({ queryKey: ["me"] })
            navigate("/")
          }
        } catch (e: any) {
          alert("ERREUR : " + e?.message)
        }
      })
    }

    setup()

    return () => {
      listener?.remove()
    }
  }, [navigate])

  return null
}
