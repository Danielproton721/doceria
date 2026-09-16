// ============================================================================
//  Google Ads — configuração central da tag.
//
//  VAZIO de propósito: esta base veio de outra loja e o ID de lá mandaria as
//  conversões da doceria pra campanha de bebidas. Com GOOGLE_ADS_ID vazio a tag
//  NÃO carrega e nenhuma conversão é enviada. Conta própria da Lumi Doçura:
//  preencha os 3 valores abaixo.
// ============================================================================

// ID de conversão do Google Ads (ex.: "AW-123456789").
export const GOOGLE_ADS_ID = ""

// Rótulos de conversão (a parte DEPOIS da "/" no send_to). Só valem com o ID.
export const GOOGLE_ADS_PAGEVIEW_LABEL = "" // visualização da home
export const GOOGLE_ADS_PURCHASE_LABEL = "" // compra confirmada

// Monta o send_to "AW-XXXX/label". Retorna "" se ID ou rótulo faltarem —
// os disparos checam isso e simplesmente não acontecem.
export function adsSendTo(label: string): string {
  return GOOGLE_ADS_ID && label ? `${GOOGLE_ADS_ID}/${label}` : ""
}
