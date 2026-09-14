"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function TrocasDevolucoes() {
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
          <h1 className="text-3xl font-bold text-foreground">Trocas e Devoluções</h1>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Direito de Arrependimento (Art. 49 do CDC)</h2>
              <p>
                De acordo com o <strong className="text-foreground">artigo 49 do Código de Defesa do Consumidor (CDC)</strong>,
                como sua compra é feita fora do estabelecimento comercial (pela internet), você tem o
                <strong className="text-foreground"> direito de arrependimento</strong> e pode desistir do pedido no prazo de
                <strong className="text-foreground"> 7 (sete) dias corridos</strong>, contados a partir da data de recebimento do produto.
              </p>
              <p>
                Nesse caso, os valores eventualmente pagos serão devolvidos <strong className="text-foreground">integralmente</strong>,
                incluindo o valor do frete, devidamente atualizados, conforme o parágrafo único do art. 49 do CDC.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Condições para Troca e Devolução</h2>
              <p>Para que a troca ou devolução seja aceita, o produto deve estar:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Na embalagem original, sem indícios de uso;</li>
                <li>Acompanhado do comprovante de compra ou número do pedido;</li>
                <li>
                  <strong className="text-foreground">Lacrado e sem violação</strong> — no caso de bebidas alcoólicas.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Particularidade das Bebidas Alcoólicas</h2>
              <p>
                Por questões sanitárias, de segurança e de saúde pública, <strong className="text-foreground">bebidas alcoólicas
                só podem ser devolvidas se estiverem lacradas e sem qualquer violação do lacre</strong>. Produtos abertos,
                consumidos parcialmente ou com lacre rompido não poderão ser aceitos para devolução, exceto nos casos de
                defeito de fabricação ou avaria comprovada.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Produtos com Defeito ou Avaria</h2>
              <p>
                Se o produto chegar danificado, com vazamento ou fora das condições adequadas, solicitamos que a ocorrência
                seja reportada <strong className="text-foreground">no ato da entrega ou em até 7 (sete) dias</strong> do
                recebimento. Após análise, faremos a substituição do produto ou o reembolso do valor pago, sem custo adicional
                para você.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Como Solicitar</h2>
              <p>
                Envie um e-mail para <strong className="text-foreground">pedidos-suporte@cumpadifood.com</strong> informando o
                <strong className="text-foreground"> número do pedido</strong>, o motivo da troca/devolução e, se possível,
                fotos do produto. Nossa equipe responderá com as orientações para a coleta ou devolução.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">6. Frete da Devolução</h2>
              <p>
                Nos casos de <strong className="text-foreground">arrependimento (art. 49 do CDC)</strong> e de
                <strong className="text-foreground"> produto com defeito/avaria</strong>, o custo da devolução é
                <strong className="text-foreground"> por conta da CumpadiFood</strong> — você não paga nada pelo frete de retorno.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">7. Prazo de Reembolso</h2>
              <p>
                Confirmada a devolução, o reembolso é processado de acordo com a forma de pagamento utilizada: pagamentos via
                <strong className="text-foreground"> PIX</strong> são estornados em até 7 dias úteis; pagamentos no
                <strong className="text-foreground"> cartão de crédito</strong> são estornados pela administradora, podendo
                aparecer em até 2 faturas subsequentes.
              </p>
            </section>
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
