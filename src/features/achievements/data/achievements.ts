// =====================================================================
// CATÁLOGO DAS CONQUISTAS — nome, frase e arte de cada uma.
//
// A regra que desbloqueia mora em `engine/regras.ts`; aqui só a aparência.
// O tipo exige uma entrada para CADA id: esquecer a arte de uma conquista
// nova é erro de compilação, não um banner vazio no aparelho.
//
// A arte é pixel art de 64×64, exportada UMA vez. O script
// `scripts/gerar-sprite-conquista.ps1` gera, a partir dela, as três densidades
// da arte e as três da silhueta — tudo ampliado por vizinho-mais-próximo. O
// Metro escolhe a densidade do aparelho, e cada pixel da arte cai inteiro na
// tela, sem o borrão da ampliação suavizada que o iOS faria.
//
// Para cadastrar uma conquista: regra em `engine/regras.ts`, arte pelo
// script, e uma entrada aqui.
// =====================================================================
import type { ImageSourcePropType } from 'react-native';

import type { AchievementId } from '../engine/regras';

export interface DefinicaoDeConquista {
  titulo: string;
  descricao: string;
  /**
   * A arte a 64 pt: lista da coleção e banner. Opcional SÓ enquanto a arte não
   * existe: sem ela, o espaço de 64×64 fica vazio (nunca uma arte emprestada).
   */
  imagem?: ImageSourcePropType;
  /** A silhueta a 64 pt: o que a lista mostra enquanto a conquista está bloqueada. Idem. */
  imagemBloqueada?: ImageSourcePropType;
}

export const CONQUISTAS: Record<AchievementId, DefinicaoDeConquista> = {
  'first-house': {
    titulo: 'Primeira casa!',
    descricao: 'Seu mundo recebeu sua primeira construção.',
    imagem: require('../../../../assets/achievements/house-conquest.png'),
    imagemBloqueada: require('../../../../assets/achievements/house-conquest-bloqueada.png'),
  },
  'era-das-especializacoes': {
    titulo: 'Era das Especializações',
    descricao: 'Sua vila amadureceu o bastante para seguir novos caminhos.',
    // ARTE PENDENTE: quando os arquivos existirem (gerar-sprite-conquista.ps1),
    // descomente e aponte as duas linhas:
    // imagem: require('../../../../assets/achievements/<nome>.png'),
    // imagemBloqueada: require('../../../../assets/achievements/<nome>-bloqueada.png'),
  },
};
