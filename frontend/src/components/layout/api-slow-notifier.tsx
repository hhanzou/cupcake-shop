"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { API_DONE_EVENT, API_SLOW_EVENT } from "@/lib/api"

const TOAST_ID = "api-slow"

/** Mostra um aviso discreto enquanto alguma requisição do navegador está demorando. */
export function ApiSlowNotifier() {
  useEffect(() => {
    let slow = 0
    const onSlow = () => {
      slow++
      toast.info("Acordando a confeitaria, pode levar até 1 minuto", { id: TOAST_ID, duration: Infinity })
    }
    const onDone = () => {
      slow = Math.max(0, slow - 1)
      if (slow === 0) toast.dismiss(TOAST_ID)
    }
    window.addEventListener(API_SLOW_EVENT, onSlow)
    window.addEventListener(API_DONE_EVENT, onDone)
    return () => {
      window.removeEventListener(API_SLOW_EVENT, onSlow)
      window.removeEventListener(API_DONE_EVENT, onDone)
    }
  }, [])

  return null
}
