// =====================================================================
// CATÁLOGO DAS CONQUISTAS — nome, frase e arte de cada uma.
//
// A regra que desbloqueia mora em `engine/regras.ts`; aqui só a aparência.
// O tipo exige uma entrada para CADA id: esquecer a arte de uma conquista
// nova é erro de compilação, não um banner vazio no aparelho.
//
// A arte é pixel art de 64×64. Os arquivos @2x e @3x são a mesma imagem
// ampliada por vizinho-mais-próximo: o Metro escolhe a densidade do aparelho
// e cada pixel da arte cai inteiro na tela, sem o borrão de uma ampliação
// suavizada.
// =====================================================================
import type { ImageSourcePropType } from 'react-native';

import type { AchievementId } from '../engine/regras';

export interface DefinicaoDeConquista {
  titulo: string;
  descricao: string;
  imagem: ImageSourcePropType;
}

export const CONQUISTAS: Record<AchievementId, DefinicaoDeConquista> = {
  'first-house': {
    titulo: 'Primeira casa!',
    descricao: 'Seu mundo recebeu sua primeira construção.',
    imagem: require('../../../../assets/achievements/house-conquest.png'),
  },
};
