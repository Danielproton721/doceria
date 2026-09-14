"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { products } from "@/lib/data"
import type { Product } from "@/lib/types"
import Image from "next/image"

interface SearchBarProps {
  onProductSelect: (product: Product) => void
}

export function SearchBar({ onProductSelect }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<Product[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const searchTerm = query.toLowerCase().trim()
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
    ).slice(0, 6)

    setResults(filtered)
  }, [query])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (product: Product) => {
    onProductSelect(product)
    setQuery("")
    setIsOpen(false)
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div className="bg-background border-b border-border py-3">
      <div className="max-w-lg mx-auto px-4">
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-secondary/50 text-foreground
                placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 
                focus:border-primary transition-all duration-200"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {isOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
              {results.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-b-0"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && query.trim().length >= 2 && results.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum produto encontrado para "{query}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
