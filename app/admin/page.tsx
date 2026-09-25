import { adminConfigured, isAuthed } from "@/lib/admin-auth"
import { kvConfigured, listRecentOrders } from "@/lib/order-store"
import { getActiveGateway } from "@/lib/gateways/active"
import { AdminLogin } from "./admin-login"
import { AdminShell } from "./admin-shell"
import { GatewaySwitch } from "./gateway-switch"
import { AdminThemeProvider } from "./theme"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  if (!adminConfigured()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h1 className="text-lg font-bold text-foreground">Painel não configurado</h1>
          <p className="text-sm text-muted-foreground">
            Defina a variável <code className="font-mono">ADMIN_PASSWORD</code> no ambiente pra liberar o acesso.
          </p>
        </div>
      </div>
    )
  }

  if (!(await isAuthed())) {
    return (
      <AdminThemeProvider>
        <AdminLogin />
      </AdminThemeProvider>
    )
  }

  const kvOk = kvConfigured()
  const orders = kvOk ? await listRecentOrders(100) : []
  const activeGateway = await getActiveGateway()

  return (
    <AdminThemeProvider>
      <AdminShell
        brand="Lumi Doçura"
        kvOk={kvOk}
        orders={orders}
        gatewaySwitch={<GatewaySwitch initial={activeGateway} kvOk={kvOk} />}
      />
    </AdminThemeProvider>
  )
}
