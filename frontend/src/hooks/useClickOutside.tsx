import { useEffect } from "react"

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void, buttonRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node) && buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        callback()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [ref, callback, buttonRef])
}
