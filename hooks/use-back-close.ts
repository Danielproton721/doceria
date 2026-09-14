"use client"

import { useEffect, useRef } from "react"

/**
 * Faz o botão "voltar" do navegador/celular FECHAR um overlay (modal, drawer)
 * em vez de sair da página.
 *
 * Ao abrir, empurra uma entrada no histórico. O `popstate` (voltar) chama
 * `onClose`. Se o overlay for fechado de outra forma (botão X, etc.), a entrada
 * extra é consumida com `history.back()` pra manter o histórico em sincronia.
 *
 * Guard de rota: se a URL mudou (ex.: navegou pro /checkout) entre abrir e
 * fechar, não chamamos `history.back()` — assim não atrapalha navegações reais.
 */
export function useBackClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return

    const openPath = window.location.pathname
    let closedByPop = false

    window.history.pushState({ overlay: true }, "")

    const handlePop = () => {
      closedByPop = true
      onCloseRef.current()
    }
    window.addEventListener("popstate", handlePop)

    return () => {
      window.removeEventListener("popstate", handlePop)
      // Fechou pelo X/programaticamente (e continua na mesma rota):
      // desfaz a entrada que adicionamos pra não "prender" o botão voltar.
      if (!closedByPop && window.location.pathname === openPath) {
        window.history.back()
      }
    }
  }, [isOpen])
}
