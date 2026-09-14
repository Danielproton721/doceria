"use client"

import Link from "next/link"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function Entrega() {
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
          <h1 className="text-3xl font-bold text-foreground">Entrega e Frete</h1>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Prazo de Entrega</h2>
              <p>
                Trabalhamos com <strong className="text-foreground">entrega rápida</strong>: em média, os pedidos chegam
                em <strong className="text-foreground">30 a 80 minutos</strong> após a confirmação do pagamento. Em horários
                de pico, finais de semana ou condições climáticas adversas, o prazo pode variar.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Regiões Atendidas</h2>
              <p>
                Realizamos entregas em <strong className="text-foreground">Barra do Corda - MA</strong> e regiões próximas
                dentro da nossa área de cobertura. A disponibilidade de entrega para o seu endereço é confirmada no momento
                em que você informa a localização e finaliza o pedido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Custo do Frete</h2>
              <p>
                Oferecemos <strong className="text-foreground">frete grátis</strong> para os endereços dentro da nossa área
                de cobertura. Caso haja alguma taxa de entrega para regiões específicas, o valor é exibido de forma clara
                antes da finalização do pedido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Acompanhamento do Pedido</h2>
              <p>
                Após a confirmação do pagamento, você recebe a confirmação do pedido por e-mail. Para acompanhar o status
                ou tirar dúvidas sobre a entrega, entre em contato pelo e-mail
                <strong className="text-foreground"> pedidos-suporte@cumpadifood.com</strong> informando o número do pedido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Recebimento</h2>
              <p>
                A entrega é feita no endereço informado no pedido. É necessário que haja uma pessoa
                <strong className="text-foreground"> maior de 18 anos</strong> para receber os produtos, podendo ser
                solicitada a apresentação de documento de identidade com foto.
              </p>
            </section>
          </div>

          {/* Aviso +18 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">+18 — Venda proibida para menores</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  A venda de bebidas alcoólicas é permitida apenas para maiores de 18 anos. A idade poderá ser conferida no
                  ato da entrega. Beba com moderação.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-6 border-t border-border">
            <p>DCM FOODS DELIVERY LTDA — CNPJ 65.217.268/0001-25</p>
            <p className="mt-1">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
