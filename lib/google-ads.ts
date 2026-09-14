// ============================================================================
//  Google Ads — configuração central da tag.
//
//  Os identificadores da CONTA ANTIGA (CompadreFood) foram removidos. Enquanto
//  GOOGLE_ADS_ID estiver vazio, a tag NÃO carrega e NENHUMA conversão é enviada
//  (a loja não fica associada a conta nenhuma). O código/estrutura continua no
//  lugar — pra religar na conta do CumpadiFood, preencha os 3 valores abaixo.
// ============================================================================

// ID de conversão do Google Ads (conta CumpadiFood).
export const GOOGLE_ADS_ID = "AW-18294614228"

// Rótulos de conversão (a parte DEPOIS da "/" no send_to). Só valem com o ID.
export const GOOGLE_ADS_PAGEVIEW_LABEL = "OpfTCMvS_ckcENTRxpNE" // visualização da home
export const GOOGLE_ADS_PURCHASE_LABEL = "JxLQCNnD6ckcENTRxpNE" // compra confirmada

// Monta o send_to "AW-XXXX/label". Retorna "" se ID ou rótulo faltarem —
// os disparos checam isso e simplesmente não acontecem.
export function adsSendTo(label: string): string {
  return GOOGLE_ADS_ID && label ? `${GOOGLE_ADS_ID}/${label}` : ""
}
