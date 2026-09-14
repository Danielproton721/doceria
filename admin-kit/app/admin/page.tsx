import { adminConfig } from "@/admin.config"
import { adminConfigured, isAuthed } from "@/lib/admin-auth"
import { kvConfigured, listRecentOrders } from "@/lib/orders"
import { getMergedCatalog, pendingChangesCount } from "@/lib/catalog"
import { AdminLogin } from "./admin-login"
import { AdminShell } from "./admin-shell"

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
    return <AdminLogin brand={adminConfig.brand} />
  }

  const kvOk = kvConfigured()
  const orders = adminConfig.modules.orders ? await listRecentOrders(100) : []
  const catalog = adminConfig.modules.products ? await getMergedCatalog() : { headers: [], rows: [] }
  const pending = adminConfig.modules.products && kvOk ? await pendingChangesCount() : 0

  return (
    <AdminShell
      brand={adminConfig.brand}
      modules={adminConfig.modules}
      columns={adminConfig.catalog.columns}
      kvOk={kvOk}
      orders={orders}
      catalog={catalog}
      pending={pending}
    />
  )
}
