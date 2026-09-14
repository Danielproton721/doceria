"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Footer } from "@/components/delivery/footer"

export default function PoliticaPrivacidade() {
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
          <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">1. Introdução</h2>
              <p>
                A DCM FOODS DELIVERY LTDA (CumpadiFood) está comprometida com a proteção da sua privacidade. Esta Política de Privacidade
                descreve como coletamos, usamos e protegemos suas informações pessoais.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">2. Coleta de Dados</h2>
              <p>
                Coletamos informações que você fornece diretamente, como nome, endereço de entrega, telefone e endereço de
                e-mail quando você faz um pedido ou se cadastra em nossa plataforma.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">3. Uso de Dados</h2>
              <p>
                Utilizamos suas informações para processar pedidos, enviar atualizações de entrega, responder a consultas e
                melhorar nossos serviços. Não compartilhamos suas informações com terceiros sem seu consentimento.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">4. Segurança</h2>
              <p>
                Implementamos medidas de segurança adequadas para proteger seus dados pessoais contra acesso não autorizado,
                alteração ou divulgação.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">5. Direitos do Usuário</h2>
              <p>
                Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais. Para exercer esses
                direitos, entre em contato conosco pelo e-mail pedidos-suporte@cumpadifood.com
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">6. Contato</h2>
              <p>
                Se tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco pelo e-mail
                pedidos-suporte@cumpadifood.com
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
