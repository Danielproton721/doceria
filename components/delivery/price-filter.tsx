"use client"

import { useState, useRef, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export type SortOrder = "default" | "cheapest" | "expensive"

interface PriceFilterProps {
  value: SortOrder
  onChange: (value: SortOrder) => void
}

export function PriceFilter({ value, onChange }: PriceFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const options: { label: string; value: SortOrder; icon: React.ReactNode }[] = [
    { label: "Padrao", value: "default", icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
    { label: "Menor preco", value: "cheapest", icon: <ArrowDown className="w-3.5 h-3.5" /> },
    { label: "Maior preco", value: "expensive", icon: <ArrowUp className="w-3.5 h-3.5" /> },
  ]

  const activeIcon = value === "cheapest" 
    ? <ArrowDown className="w-4 h-4" /> 
    : value === "expensive" 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowUpDown className="w-4 h-4" />

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
          value !== "default"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
        }`}
        aria-label="Filtrar por preco"
      >
        {activeIcon}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm transition-colors ${
                value === option.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-secondary"
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function sortProducts(products: { price: number }[], order: SortOrder) {
  if (order === "default") return products
  return [...products].sort((a, b) =>
    order === "cheapest" ? a.price - b.price : b.price - a.price
  )
}
