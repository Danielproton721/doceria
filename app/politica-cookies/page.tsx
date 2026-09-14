"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function PoliticaCookies() {
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
          <h1 className="text-3xl font-bold text-foreground">Política de Cookies</h1>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. O Que São Cookies?</h2>
              <p>
                Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nosso site. Eles
                ajudam a melhorar sua experiência de navegação.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Tipos de Cookies Utilizados</h2>
              <p>
                <strong>Cookies Essenciais:</strong> Necessários para o funcionamento do site e suas funcionalidades básicas.
              </p>
              <p>
                <strong>Cookies de Preferência:</strong> Lembram suas escolhas para personalizar sua experiência.
              </p>
              <p>
                <strong>Cookies de Análise:</strong> Ajudam a entender como nossos usuários interagem com o site.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Dados Armazenados</h2>
              <p>
                Utilizamos cookies para armazenar informações como endereço de entrega, histórico de carrinho e preferências
                de navegação para melhorar seu atendimento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Controle de Cookies</h2>
              <p>
                Você pode controlar cookies através das configurações do seu navegador. Desativar cookies pode afetar algumas
                funcionalidades do site.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Terceiros</h2>
              <p>
                Alguns cookies podem ser definidos por terceiros, como provedores de análise. Consultamos sobre suas próprias
                políticas de cookies.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">6. Alterações</h2>
              <p>
                Podemos atualizar esta Política de Cookies a qualquer momento. Recomendamos revisar periodicamente para
                conhecer as mudanças.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">7. Contato</h2>
              <p>
                Para dúvidas sobre cookies e privacidade, entre em contato pelo e-mail pedidos-suporte@cumpadifood.com
              </p>
              <p>
                <strong className="text-foreground">DCM FOODS DELIVERY LTDA</strong> — CNPJ 65.217.268/0001-25
                <br />
                Rua Vereador Francisco Diniz, 80, Anexo A — Trizidela, Barra do Corda - MA — CEP 65.950-000
              </p>
            </section>
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
