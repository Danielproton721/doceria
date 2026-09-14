import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// sigla -> nome do estado (pra exibir "Minas Gerais" em vez de "MG")
const SIGLA_TO_NOME: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

function siglaFromNome(nome: string): string {
  const n = norm(nome)
  for (const [sig, nm] of Object.entries(SIGLA_TO_NOME)) {
    if (norm(nm) === n) return sig
  }
  return ""
}

export async function GET(request: Request) {
  const h = request.headers

  // 1) Produção na Vercel: a geolocalização do IP do visitante vem nos headers.
  const vercelCity = h.get("x-vercel-ip-city")
  if (vercelCity) {
    const city = decodeURIComponent(vercelCity)
    const region = (h.get("x-vercel-ip-country-region") || "").split("-").pop() || ""
    const sigla = region.toUpperCase()
    return NextResponse.json({
      ok: true,
      city,
      sigla,
      estado: SIGLA_TO_NOME[sigla] || sigla,
      country: h.get("x-vercel-ip-country") || "BR",
      source: "vercel",
    })
  }

  // 2) Dev (sem headers da Vercel): geolocaliza o IP do servidor — em dev é a
  //    sua máquina, então bate com a sua localização real. NÃO usar em produção
  //    (lá geolocalizaria o datacenter).
  if (process.env.NODE_ENV !== "production") {
    const debug: string[] = []
    // Teste: /api/geo?ip=8.8.8.8 geolocaliza ESSE ip (prova que é o IP que manda).
    const testIp = new URL(request.url).searchParams.get("ip")?.trim()
    // ipwho.is e ipapi.co usam region_code; geojs só "region" (nome).
    const fontes = testIp
      ? [`https://ipwho.is/${testIp}`, `https://ipapi.co/${testIp}/json/`, `https://get.geojs.io/v1/ip/geo/${testIp}.json`]
      : ["https://ipwho.is/", "https://ipapi.co/json/", "https://get.geojs.io/v1/ip/geo.json"]
    for (const url of fontes) {
      try {
        const r = await fetch(url, { cache: "no-store" })
        const d: any = await r.json()
        const city = d?.city
        if (city && d?.success !== false) {
          const estado = d.region || SIGLA_TO_NOME[String(d.region_code || "").toUpperCase()] || ""
          const sigla = String(d.region_code || "").toUpperCase() || siglaFromNome(estado)
          return NextResponse.json({
            ok: true,
            city,
            sigla,
            estado: estado || sigla,
            country: d.country_code || "BR",
            source: url,
          })
        }
        debug.push(`${url}: sem city`)
      } catch (e: any) {
        debug.push(`${url}: ${e?.message || e}`)
      }
    }
    return NextResponse.json({ ok: false, dev: true, debug })
  }

  return NextResponse.json({ ok: false })
}
