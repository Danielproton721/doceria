"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function TermosServico() {
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
          <h1 className="text-3xl font-bold text-foreground">Termos de Serviço</h1>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
              <p>
                Ao usar a plataforma da DCM FOODS DELIVERY LTDA (CumpadiFood), você concorda com estes Termos de Serviço. Se não concordar
                com alguma disposição, por favor, não use nossos serviços.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
              <p>
                Oferecemos uma plataforma de comércio eletrônico para venda de bebidas de qualidade com entrega rápida.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Prazo de Entrega</h2>
              <p>
                Os prazos de entrega são estimados e variam conforme a localização e disponibilidade de estoque. Em média,
                as entregas ocorrem dentro de 30 a 80 minutos após a confirmação do pedido. Não nos responsabilizamos por
                atrasos causados por fatores externos, como condições climáticas ou problemas viários.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Pedido Mínimo</h2>
              <p>
                Alguns produtos possuem quantidade mínima de compra. Essas restrições estão claramente indicadas na descrição
                do produto.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Pagamento</h2>
              <p>
                Aceitamos pagamento via PIX e outros métodos conforme disponível na plataforma. O pagamento deve ser realizado
                no momento da finalização do pedido.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">6. Devolução e Cancelamento</h2>
              <p>
                Pedidos podem ser cancelados antes da confirmação da entrega. Produtos danificados na entrega devem ser
                reportados em até 24 horas para análise e reembolso ou substituição.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">7. Responsabilidade</h2>
              <p>
                A DCM FOODS DELIVERY LTDA não se responsabiliza por danos indiretos ou consequentes resultantes do uso de
                nossos serviços, exceto onde proibido por lei.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">8. Legislação Aplicável</h2>
              <p>
                Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">9. Contato</h2>
              <p>
                Para dúvidas ou reclamações, entre em contato conosco pelo e-mail pedidos-suporte@cumpadifood.com
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
