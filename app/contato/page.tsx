"use client"

import Link from "next/link"
import { ArrowLeft, Mail, MapPin, Clock, Building2 } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function Contato() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Link>

        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          <h1 className="text-3xl font-bold text-foreground">Contato</h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Fale com a gente. Para dúvidas sobre pedidos, trocas, entregas ou qualquer assunto, use os canais abaixo.
          </p>

          <div className="space-y-4">
            {/* Empresa */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">DCM FOODS DELIVERY LTDA</p>
                <p className="text-muted-foreground">CNPJ: 65.217.268/0001-25</p>
              </div>
            </div>

            {/* E-mail */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">E-mail</p>
                <a href="mailto:pedidos-suporte@cumpadifood.com" className="text-primary hover:underline">
                  pedidos-suporte@cumpadifood.com
                </a>
              </div>
            </div>

            {/* Endereço */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Endereço</p>
                <p className="text-muted-foreground">
                  Rua Vereador Francisco Diniz, 80, Anexo A — Trizidela
                  <br />
                  Barra do Corda - MA — CEP 65.950-000
                </p>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-4">
              <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Horário de Atendimento</p>
                <p className="text-muted-foreground">
                  Segunda a sábado: 9h às 22h
                  <br />
                  Domingos e feriados: 14h às 22h
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-6 border-t border-border">
            <p>Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
