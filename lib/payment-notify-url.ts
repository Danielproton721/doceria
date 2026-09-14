const DEFAULT_PAYMENT_WEBHOOK_PATH = "/api/webhook/pagou"

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "")
}

export function getPaymentNotifyUrl(request: Request, path = DEFAULT_PAYMENT_WEBHOOK_PATH) {
  const override = process.env.NOTIFY_URL_OVERRIDE?.trim()
  if (override) return override

  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredAppUrl) return `${trimTrailingSlash(configuredAppUrl)}${path}`

  const origin = new URL(request.url).origin
  return `${trimTrailingSlash(origin)}${path}`
}
