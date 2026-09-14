"use client"

import Link from "next/link"
import { FileText, Shield, Cookie, ShieldAlert, RefreshCcw, Truck, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-16 bg-card border-t border-border">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Atendimento e Políticas */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-4">Atendimento e Políticas</h3>
          <div className="space-y-2">
            <Link
              href="/contato"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm">Contato</span>
            </Link>
            <Link
              href="/entrega"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <Truck className="w-4 h-4" />
              <span className="text-sm">Entrega e Frete</span>
            </Link>
            <Link
              href="/trocas"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span className="text-sm">Trocas e Devoluções</span>
            </Link>
            <Link
              href="/politica-privacidade"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm">Política de Privacidade</span>
            </Link>
            <Link
              href="/termos-servico"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Termos de Serviço</span>
            </Link>
            <Link
              href="/politica-cookies"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors py-2"
            >
              <Cookie className="w-4 h-4" />
              <span className="text-sm">Política de Cookies</span>
            </Link>
          </div>
        </div>

        {/* Aviso +18 */}
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">
                {"+18 \u2014 Venda proibida para menores"}
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                {"A venda de bebidas alco\u00f3licas \u00e9 permitida apenas para maiores de 18 anos. A idade poder\u00e1 ser conferida no ato da entrega. Beba com modera\u00e7\u00e3o."}
              </p>
            </div>
          </div>
        </div>

        {/* Informações da Empresa */}
        <div className="border-t border-border pt-6 mt-6 space-y-1">
          <p className="text-xs font-semibold text-foreground">DCM FOODS DELIVERY LTDA</p>
          <p className="text-xs text-muted-foreground">CNPJ: 65.217.268/0001-25</p>
          <p className="text-xs text-muted-foreground">
            Rua Vereador Francisco Diniz, 80, Anexo A — Trizidela, Barra do Corda - MA — CEP 65.950-000
          </p>
          <p className="text-xs text-muted-foreground">
            Contato:{" "}
            <a href="mailto:pedidos-suporte@cumpadifood.com" className="text-primary hover:underline">pedidos-suporte@cumpadifood.com</a>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            © {new Date().getFullYear()} DCM FOODS DELIVERY LTDA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
