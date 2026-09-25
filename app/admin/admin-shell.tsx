"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, Mail, RadioTower, ShoppingBag } from "lucide-react"
import type { AdminOrder } from "@/lib/order-store"
import { LogoutButton } from "./logout-button"
import { OnlineCount } from "./online-count"
import { VisitorsHistory } from "./visitors-history"
import { OrdersPanel } from "./orders-panel"
import { SetupStatus } from "./setup-status"
import { EmailPanel } from "./email-panel"
import { BotaoTema } from "./theme"

type Tab = "orders" | "relay" | "email" | "keys"

export function AdminShell({
  brand,
  kvOk,
  orders,
  gatewaySwitch,
}: {
  brand: string
  kvOk: boolean
  orders: AdminOrder[]
  gatewaySwitch?: React.ReactNode
}) {
  const [tab, setTab] = useState<Tab>("orders")

  const pagos = orders.filter((o) => o.status === "pago").length
  const abandonados = orders.filter((o) => o.status === "abandonado").length

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Painel · {brand}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {orders.length} pedido(s) · {pagos} pago(s) · {abandonados} abandonado(s)
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <OnlineCount />
            <BotaoTema />
            <LogoutButton />
          </div>
        </div>

        <VisitorsHistory />

        {gatewaySwitch}

        <div className="mb-5 flex w-full rounded-xl border border-border bg-card p-1 sm:inline-flex sm:w-auto">
          <TabButton active={tab === "orders"} onClick={() => setTab("orders")} icon={<ShoppingBag className="h-4 w-4" />}>
            Pedidos
          </TabButton>
          <TabButton active={tab === "relay"} onClick={() => setTab("relay")} icon={<RadioTower className="h-4 w-4" />}>
            Relay
          </TabButton>
          <TabButton active={tab === "email"} onClick={() => setTab("email")} icon={<Mail className="h-4 w-4" />}>
            E-mail
          </TabButton>
          <TabButton active={tab === "keys"} onClick={() => setTab("keys")} icon={<KeyRound className="h-4 w-4" />}>
            Chaves
          </TabButton>
        </div>

        {tab === "orders" && <OrdersPanel orders={orders} kvOk={kvOk} />}
        {tab === "relay" && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Relay do pagamento</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              A tela do relay mostra o endereço de destino pra cadastrar no painel do relay e confere se as
              duas variáveis estão ativas.
            </p>
            <Link
              href="/admin/relay"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <RadioTower className="h-3.5 w-3.5" /> Abrir tela do relay
            </Link>
          </div>
        )}
        {tab === "email" && <EmailPanel />}
        {tab === "keys" && <SetupStatus />}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors sm:flex-none ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
