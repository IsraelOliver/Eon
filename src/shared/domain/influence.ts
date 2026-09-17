/**
 * Influências do conhecimento. Contrato neutro entre learning (quem produz)
 * e world (quem interpreta). Fica em shared para nenhuma feature importar a outra.
 *
 * Adicionar uma chave aqui obriga o world a dizer o que ela faz crescer
 * (a tabela em world/engine/growth.ts é um Record completo).
 */
export type InfluenceKey = 'vegetacao' | 'povoamento' | 'infraestrutura' | 'exploracao' | 'observacao';

/** Quanto uma curiosidade contribui para uma influência. Ex.: { chave: 'vegetacao', peso: 2 }. */
export interface KnowledgeInfluence {
  chave: InfluenceKey;
  peso: number;
}
