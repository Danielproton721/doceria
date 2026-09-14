"use client"

import Image from "next/image"
import { MapPin } from "lucide-react"

export function AboutUs() {
  return (
    <section className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-lg font-bold text-foreground mb-4">Sobre Nós</h2>
      
      <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
        <div className="relative w-full h-56 bg-muted">
          <Image
            src="/store-front-lumi.webp"
            alt="Doces da Lumi Doçura"
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover object-top"
          />
        </div>
        
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-foreground text-lg">Lumi Doçura</h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Lumi Doçura leva até você morango cravejado, açaí cremoso, copos da felicidade e sobremesas
            na travessa, com entrega rápida e pagamento por Pix.
          </p>
          
          
        </div>
      </div>
    </section>
  )
}
