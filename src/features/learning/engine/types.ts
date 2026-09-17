import type { InfluenceKey, KnowledgeInfluence } from '../../../shared/domain/influence';
import type { ThemeKey } from '../../../shared/domain/themeKey';

// Contratos neutros vindos de shared/domain, reexportados por conveniência.
export type { InfluenceKey, KnowledgeInfluence, ThemeKey };

export type CuriosityId = string;

/** Palavra-chave livre, em minúsculas e sem acento. Ex.: 'infraestrutura'. */
export type Tag = string;

/** De onde a informação veio. */
export interface CuriositySource {
  titulo: string;
  url?: string;
  autor?: string;
}

export interface Curiosity {
  id: CuriosityId;
  titulo: string;
  /** Resumo curto (1–2 frases) para listas. */
  preview: string;
  conteudo: string;
  tema: ThemeKey;
  tags: Tag[];
  influencias: KnowledgeInfluence[];
  /** Pelo menos uma fonte (o tipo não aceita lista vazia). */
  fontes: [CuriositySource, ...CuriositySource[]];
  /** Data da última verificação, no formato 'AAAA-MM-DD'. Omitida quando não se aplica. */
  verificadoEm?: string;
}

/** Progresso invisível do jogador: o que ele aprendeu e para onde isso aponta. */
export interface KnowledgeProfile {
  /** Ids na ordem em que foram aprendidas. O total é o tamanho desta lista. */
  aprendidas: CuriosityId[];
  porTema: Record<ThemeKey, number>;
  porTag: Record<Tag, number>;
  porInfluencia: Partial<Record<InfluenceKey, number>>;
}

/**
 * Resultado de registrar uma curiosidade.
 * Em 'aprendida', `influencias` é o que acabou de ser ganho: é a entrada que o
 * mundo usará no futuro para gerar eventos de crescimento.
 */
export type LearningResult =
  | {
      status: 'aprendida';
      perfil: KnowledgeProfile;
      curiosidadeId: CuriosityId;
      tema: ThemeKey;
      influencias: KnowledgeInfluence[];
    }
  | {
      status: 'repetida';
      /** O mesmo perfil recebido: nada mudou. */
      perfil: KnowledgeProfile;
      curiosidadeId: CuriosityId;
    };
