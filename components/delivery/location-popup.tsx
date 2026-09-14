"use client"

import React from "react"

import { useState, useEffect } from "react"
import { MapPin, Loader2, CheckCircle2, Store, Search, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

// Lista de estados brasileiros
const ESTADOS_BRASIL = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapa" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceara" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espirito Santo" },
  { sigla: "GO", nome: "Goias" },
  { sigla: "MA", nome: "Maranhao" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Para" },
  { sigla: "PB", nome: "Paraiba" },
  { sigla: "PR", nome: "Parana" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piaui" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondonia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "Sao Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
]

// Funcao para buscar TODAS as cidades de um estado pela API do IBGE
async function fetchCidadesIBGE(uf: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
    )
    if (!response.ok) throw new Error("Erro ao buscar cidades")
    const data = await response.json()
    return data.map((cidade: { nome: string }) => cidade.nome)
  } catch (error) {
    console.error("Erro ao buscar cidades:", error)
    return []
  }
}

interface LocationPopupProps {
  onClose: () => void
  onLocationSet: (address: string) => void
}

export function LocationPopup({ onClose, onLocationSet }: LocationPopupProps) {
  const [step, setStep] = useState<"detecting" | "detected" | "state" | "city" | "searching" | "found">("detecting")
  const [detected, setDetected] = useState<{ city: string; sigla: string; estado: string } | null>(null)
  const [selectedState, setSelectedState] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [cidadesDoEstado, setCidadesDoEstado] = useState<string[]>([])
  const [loadingCidades, setLoadingCidades] = useState(false)
  const [searchState, setSearchState] = useState("")
  const [searchCity, setSearchCity] = useState("")

  const filteredStates = ESTADOS_BRASIL.filter(
    (estado) =>
      estado.nome.toLowerCase().includes(searchState.toLowerCase()) ||
      estado.sigla.toLowerCase().includes(searchState.toLowerCase())
  )

  const filteredCities = cidadesDoEstado.filter((cidade) =>
    cidade.toLowerCase().includes(searchCity.toLowerCase())
  )

  useEffect(() => {
    if (selectedState) {
      setLoadingCidades(true)
      setCidadesDoEstado([])
      fetchCidadesIBGE(selectedState).then((cidades) => {
        setCidadesDoEstado(cidades)
        setLoadingCidades(false)
      })
    }
  }, [selectedState])

  // Detecta a cidade/estado pelo IP ao abrir (sem o usuário escolher).
  useEffect(() => {
    let cancelled = false
    fetch("/api/geo", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d?.ok && d.city) {
          setDetected({ city: d.city, sigla: d.sigla || "", estado: d.estado || d.sigla || "" })
          setStep("detected")
        } else {
          setStep("state")
        }
      })
      .catch(() => {
        if (!cancelled) setStep("state")
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Efeito para o timer de 3.5 segundos no passo "searching"
  useEffect(() => {
    if (step === "searching") {
      const timer = setTimeout(() => {
        setStep("found")
      }, 3000) // 3 segundos
      return () => clearTimeout(timer)
    }
  }, [step])

  const handleStateSelect = (sigla: string) => {
    setSelectedState(sigla)
    setSelectedCity("")
    setSearchState("")
    setSearchCity("")
    setStep("city")
  }

  const handleCitySelect = (cidade: string) => {
    setSelectedCity(cidade)
    setSearchCity("")
  }

  const handleConfirm = () => {
    if (selectedCity && selectedState) {
      setStep("searching")
    }
  }

  const handleConfirmDetected = () => {
    if (!detected) return
    setSelectedState(detected.sigla)
    setSelectedCity(detected.city)
    setStep("searching")
  }

  const handleGoShopping = () => {
    const estadoNome = ESTADOS_BRASIL.find(e => e.sigla === selectedState)?.nome || selectedState
    onLocationSet(`${selectedCity}, ${estadoNome}`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ minHeight: '100dvh' }}>
      <div className="fixed inset-0 bg-black/60 animate-in fade-in duration-300" />
      
      <div className="relative z-[61] bg-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header - oculto nas telas de loading */}
        {(step === "state" || step === "city") && (
          <div className="bg-primary p-6 text-primary-foreground text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold">Onde voce esta?</h2>
            <p className="text-sm text-primary-foreground/80 mt-1">
              {step === "state" ? "Escolha seu estado" : "Escolha sua cidade"}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Detectando localização pelo IP */}
          {step === "detecting" && (
            <div className="py-10 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Detectando sua localização…</p>
            </div>
          )}

          {/* Localização detectada — confirmar */}
          {step === "detected" && detected && (
            <div className="py-2 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <HelpCircle className="w-9 h-9 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Localização Detectada</h2>
              <p className="text-sm text-muted-foreground mt-2 mb-6">
                Vimos que você está em{" "}
                <span className="font-bold text-foreground">
                  {detected.city}{detected.estado ? ` - ${detected.estado}` : ""}
                </span>
                . Está correto?
              </p>
              <Button
                onClick={handleConfirmDetected}
                className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Sim, está correto
              </Button>
              <Button
                onClick={() => setStep("state")}
                variant="ghost"
                className="w-full py-5 mt-2 text-foreground font-semibold hover:bg-secondary"
              >
                Não, mudar cidade
              </Button>
            </div>
          )}

          {/* Selecao de Estado */}
          {step === "state" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchState}
                  onChange={(e) => setSearchState(e.target.value)}
                  placeholder="Buscar estado..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground
                    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                    transition-all duration-200 text-sm placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                {filteredStates.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {"Nenhum estado encontrado"}
                  </div>
                ) : (
                  filteredStates.map((estado) => (
                    <button
                      key={estado.sigla}
                      onClick={() => handleStateSelect(estado.sigla)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm text-foreground
                        hover:bg-primary/10 active:bg-primary/20 transition-colors cursor-pointer"
                    >
                      <span>{estado.nome}</span>
                      <span className="text-xs text-muted-foreground font-medium">{estado.sigla}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Selecao de Cidade */}
          {step === "city" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button
                onClick={() => { setStep("state"); setSelectedState(""); setSearchState(""); }}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span className="font-medium">
                  {ESTADOS_BRASIL.find(e => e.sigla === selectedState)?.nome}
                </span>
                <span className="text-muted-foreground">{"- Trocar estado"}</span>
              </button>

              {loadingCidades ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Carregando cidades...</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchCity}
                      onChange={(e) => setSearchCity(e.target.value)}
                      placeholder="Buscar cidade..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/50 text-foreground
                        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                        transition-all duration-200 text-sm placeholder:text-muted-foreground"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                    {filteredCities.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        {"Nenhuma cidade encontrada"}
                      </div>
                    ) : (
                      filteredCities.map((cidade) => (
                        <button
                          key={cidade}
                          onClick={() => handleCitySelect(cidade)}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                            selectedCity === cidade
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-primary/5 active:bg-primary/10"
                          }`}
                        >
                          {cidade}
                        </button>
                      ))
                    )}
                  </div>
                  {selectedCity && (
                    <Button
                      onClick={handleConfirm}
                      className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base font-semibold
                        hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                      {"Confirmar \u2014 "}{selectedCity}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tela de Procurando Loja */}
          {step === "searching" && (
            <div className="py-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="w-9 h-9 text-primary" />
                </div>
                <svg className="absolute inset-0 w-20 h-20 animate-spin" viewBox="0 0 80 80">
                  <circle
                    cx="40" cy="40" r="38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray="80 160"
                    strokeLinecap="round"
                    className="text-primary"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                {"Estamos procurando a loja mais proxima de voce"}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {selectedCity}, {ESTADOS_BRASIL.find(e => e.sigla === selectedState)?.nome}
              </p>
              <div className="mt-4 flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* Tela de Loja Encontrada */}
          {step === "found" && (
            <div className="py-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center mb-2">
                {"Encontramos uma loja a 2,5 KM de voc\u00ea!"}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                {selectedCity}, {ESTADOS_BRASIL.find(e => e.sigla === selectedState)?.nome}
              </p>
              <Button
                onClick={handleGoShopping}
                className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-base font-semibold
                  hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                {"Ir as compras"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
