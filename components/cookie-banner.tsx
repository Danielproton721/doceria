"use client"

import { useState, useEffect } from "react"
import { X, Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verifica se o usuário já aceitou cookies
    const cookieAccepted = localStorage.getItem("cookiesAccepted")
    if (!cookieAccepted) {
      // Mostrar após 1 segundo de delay para melhor UX
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookiesAccepted", "true")
    setIsVisible(false)
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-center gap-4 max-w-md mx-auto">
        <Cookie className="w-5 h-5 text-primary flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground font-medium mb-1">
            Usamos cookies
          </p>
          <p className="text-xs text-muted-foreground">
            Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{" "}
            <Link href="/politica-cookies" className="text-primary hover:underline">
              Política de Cookies
            </Link>
            .
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto mt-2">
        <Button
          onClick={handleAccept}
          size="sm"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Aceitar
        </Button>
      </div>
    </div>
  )
}
