import { useEffect } from "react"
import { useNavigate } from "react-router"
import { useQueryClient } from "@tanstack/react-query"

export default function AuthSuccess() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  useEffect(() => {
    queryClient.refetchQueries({ queryKey: ["me"] }).then(() => {
      navigate("/", { replace: true })
    })
  }, [])
  return null
}
