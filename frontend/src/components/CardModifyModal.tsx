import { X } from "lucide-react"
import type { Card, OwnedVariant, SetModel } from "../types"
import { useClickOutside } from "../hooks/useClickOutside"
import { useEffect, useRef, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiService } from "../services/apiService"
import { useAuth } from "../hooks/useAuth"

interface CardModalInterface {
  card: Card
  isBaseSet: boolean
}

type CardFormInputs = Omit<OwnedVariant, "id" | "cardId">

const CardModifyModal = ({ card, isBaseSet }: CardModalInterface) => {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const imgRef = useRef(null)
  const cardModalRef = useRef(null)
  useClickOutside(cardModalRef, () => setOpen(false), imgRef)
  const handleImageClick = () => {
    if (!isAuthenticated) return
    setOpen(!open)
  }
  const { register, handleSubmit, reset } = useForm<CardFormInputs>({
    defaultValues: {
      normal: card.ownedVariant?.normal ?? 0,
      holo: card.ownedVariant?.holo ?? 0,
      reverse: card.ownedVariant?.reverse ?? 0,
      firstEdition: card.ownedVariant?.firstEdition ?? 0,
      secondEdition: card.ownedVariant?.secondEdition ?? 0,
    },
  })
  useEffect(() => {
    reset({
      normal: card.ownedVariant?.normal ?? 0,
      holo: card.ownedVariant?.holo ?? 0,
      reverse: card.ownedVariant?.reverse ?? 0,
      firstEdition: card.ownedVariant?.firstEdition ?? 0,
      secondEdition: card.ownedVariant?.secondEdition ?? 0,
    })
  }, [card.ownedVariant])
  const queryClient = useQueryClient()
  const modifyCardMutation = useMutation({
    mutationFn: (data: CardFormInputs) => apiService.updateVariant(card.id, data),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ["Extension"] })

      const previous = queryClient.getQueryData(["Extension"])

      // Met à jour le cache optimistiquement
      queryClient.setQueryData<SetModel>(["Extension"], (old) => ({
        ...old!,
        cards: old!.cards.map((oldCard: Card) =>
          oldCard.id === card.id
            ? {
                ...oldCard,
                ownedVariant: {
                  id: oldCard.ownedVariant?.id ?? 0,
                  cardId: oldCard.ownedVariant?.cardId ?? card.id,
                  ...newData,
                } satisfies OwnedVariant,
              }
            : oldCard,
        ),
      }))

      return { previous }
    },
    onError: (_err, _variables, context) => {
      // Rollback si erreur
      queryClient.setQueryData(["Extension"], context?.previous)
    },
    onSuccess: () => setOpen(false),
  })

  const onSubmit: SubmitHandler<CardFormInputs> = (data) => {
    modifyCardMutation.mutate(data)
  }

  return (
    <div className="relative">
      <img
        className={`h-65 ${!card.ownedVariant ? "grayscale" : ""} ${!isAuthenticated ? "cursor-default" : "cursor-pointer"}`}
        src={`${card.image}/low.png`}
        onClick={handleImageClick}
        ref={imgRef}
        title={`${isAuthenticated ? "" : "Connectez-vous pour modifier"}`}
      />
      <div
        ref={cardModalRef}
        className={`${open ? "" : "hidden"} bg-secondary/90 absolute top-0 z-10 h-65 w-full rounded-sm border border-zinc-500 px-2 py-1`}
      >
        <form className="flex h-full flex-col justify-between" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex w-full justify-end">
            <X onClick={() => setOpen(!open)} className="cursor-pointer" />
          </div>
          <div className="flex w-full items-center justify-between">
            <label className="font-bold uppercase">Normal</label>
            <input className="w-14 rounded-md border border-zinc-500 text-center" type="number" {...register("normal", { valueAsNumber: true })} />
          </div>
          <div className="flex w-full items-center justify-between">
            <label className="font-bold uppercase">Holo</label>
            <input className="w-14 rounded-md border border-zinc-500 text-center" type="number" {...register("holo", { valueAsNumber: true })} />
          </div>
          <div className="flex w-full items-center justify-between">
            <label className="font-bold uppercase">Reverse</label>
            <input className="w-14 rounded-md border border-zinc-500 text-center" type="number" {...register("reverse", { valueAsNumber: true })} />
          </div>
          <div className="flex w-full items-center justify-between">
            <label className="font-bold uppercase">
              1<sup>ere</sup> édition
            </label>
            <input
              className="w-14 rounded-md border border-zinc-500 text-center disabled:cursor-not-allowed disabled:opacity-50"
              type="number"
              disabled={!isBaseSet}
              {...register("firstEdition", { valueAsNumber: true })}
            />
          </div>
          <div className="flex w-full items-center justify-between">
            <label className="font-bold uppercase">
              2<sup>nd</sup> édition
            </label>
            <input
              className="w-14 rounded-md border border-zinc-500 text-center disabled:cursor-not-allowed disabled:opacity-50"
              type="number"
              disabled={!isBaseSet}
              {...register("secondEdition", { valueAsNumber: true })}
            />
          </div>
          <button
            className="from-primary to-secondary w-full cursor-pointer rounded-lg bg-linear-to-br py-2 text-xs font-bold tracking-wider uppercase"
            type="submit"
            onClick={() => setOpen(!open)}
          >
            Modifier
          </button>
        </form>
      </div>
    </div>
  )
}

export default CardModifyModal
