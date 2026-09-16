"use client"

import Link from "next/link"
import { FileText, Shield, Cookie, RefreshCcw, Truck, Mail } from "lucide-react"

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

        {/* Informações da Empresa */}
        <div className="border-t border-border pt-6 mt-6 space-y-1">
          <p className="text-xs font-semibold text-foreground">DCM FOODS DELIVERY LTDA</p>
          <p className="text-xs text-muted-foreground">CNPJ: 65.217.268/0001-25</p>
          <p className="text-xs text-muted-foreground">
            Rua Vereador Francisco Diniz, 80, Anexo A — Trizidela, Barra do Corda - MA — CEP 65.950-000
          </p>
          <p className="text-xs text-muted-foreground">
            Contato:{" "}
            <a href="mailto:contato@lumidocura.shop" className="text-primary hover:underline">contato@lumidocura.shop</a>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            © {new Date().getFullYear()} DCM FOODS DELIVERY LTDA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
