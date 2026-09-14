import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { CookieBanner } from '@/components/cookie-banner'
import { AgeVerification } from '@/components/delivery/age-verification'
import { PresenceTracker } from '@/components/delivery/presence-tracker'
import { CartProvider } from '@/lib/cart-context'
import { GOOGLE_ADS_ID } from '@/lib/google-ads'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CumpadiFood - Pedidos Online',
  description: 'Bebida gelada pro teu bloco - entrega rapida!',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#e8202b',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google tag (gtag.js) — carrega só quando GOOGLE_ADS_ID está preenchido
            (lib/google-ads.ts). Vazio = tag desligada, nenhuma conta associada. */}
        {GOOGLE_ADS_ID ? (
          <>
            <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
            <Script id="google-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GOOGLE_ADS_ID}');
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body className={`font-sans antialiased`}>
        <CartProvider>
          <AgeVerification />
          {children}
          <CookieBanner />
          <PresenceTracker />
        </CartProvider>
      </body>
    </html>
  )
}
