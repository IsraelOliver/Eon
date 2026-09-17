// =====================================================================
// COLOCAR ELEMENTOS — aprender, esquecer e revisar
// Funções puras: recebem a lista atual e devolvem uma nova.
// =====================================================================
import { H, NOMES, W } from './rules';
import { CHAVES_TEMAS, TEMAS } from './themes';
import type { Element, Resultado, Rng, ThemeKey, Tile, World } from './types';

/** Procura o melhor lugar para o tema e coloca um elemento lá. */
export function aprender(
  mundo: World,
  elementos: Element[],
  chave: ThemeKey,
  rng: Rng,
  protegido = false,
): Resultado {
  const tema = TEMAS[chave];
  let melhor: Tile | null = null;
  let nota = -Infinity;
  const nTema = elementos.filter((e) => e.tema === chave).length;

  for (let t = 0; t < 500; t++) {
    const x = 2 + Math.floor(rng() * (W - 4));
    const y = 3 + Math.floor(rng() * (H - 4));
    const i = y * W + x;
    if (mundo.agua[i]) continue;

    let maisPerto = Infinity;
    let pertoHist = Infinity;
    let pertoGeo = Infinity;
    let pertoNat = Infinity;
    let bloqueado = false;
    for (const el of elementos) {
      const d = Math.hypot(el.x - x, el.y - y);
      if (d < (tema.min + TEMAS[el.tema].min) / 2) {
        bloqueado = true;
        break;
      }
      if (d < maisPerto) maisPerto = d;
      if (el.tema === 'historia' && d < pertoHist) pertoHist = d;
      if (el.tema === 'geologia' && d < pertoGeo) pertoGeo = d;
      if (el.tema === 'natureza' && d < pertoNat) pertoNat = d;
    }
    if (bloqueado) continue;

    const c: Tile = {
      x,
      y,
      tipo: mundo.tipo[i],
      e: mundo.alt[i],
      distMont: mundo.distMont[i],
      distAgua: mundo.distAgua[i],
      maisPerto,
      pertoHist,
      pertoGeo,
      pertoNat,
    };
    let s = tema.pontuar(c);
    if (s === null) continue;
    s += rng() * 0.8; // um pouco de acaso para não ficar robótico
    if (s > nota) {
      nota = s;
      melhor = c;
    }
  }

  if (!melhor) {
    return {
      elementos,
      mensagem: `Nenhum lugar serve para ${tema.nome} neste mundo. As regras estão restritivas demais para ele (tente outra semente ou ajuste as regras).`,
    };
  }

  const novo: Element = {
    tema: chave,
    tipo: tema.sprite(melhor, nTema),
    x: melhor.x,
    y: melhor.y,
    protegido,
    desbotado: false,
    brilha: false,
  };
  return {
    elementos: [...elementos, novo].sort((a, b) => a.y - b.y), // quem está mais abaixo é desenhado por cima
    mensagem: `${tema.nome}: ${tema.motivo(melhor)} (${NOMES[melhor.tipo]}, altitude ${melhor.e.toFixed(2)}).`,
  };
}

/** O mundo nunca começa 100% vazio: três plantas protegidas. */
export function semear(mundo: World, rng: Rng): Resultado {
  let elementos: Element[] = [];
  for (let k = 0; k < 3; k++) elementos = aprender(mundo, elementos, 'historia', rng, true).elementos;
  return { elementos, mensagem: 'Mundo novo. Três plantas já nasceram para ele não começar vazio.' };
}

/** Passar 3 dias sem revisar: parte dos elementos livres desbota. */
export function esquecer(elementos: Element[], rng: Rng): Resultado {
  const livres = elementos.filter((e) => !e.protegido);
  if (!livres.length) {
    return { elementos, mensagem: 'Aprenda algumas curiosidades antes. Os primeiros elementos são protegidos.' };
  }
  const limite = Math.floor(livres.length * 0.5);
  const jaDesb = livres.filter((e) => e.desbotado).length;
  const n = Math.min(Math.max(1, Math.ceil(livres.length * 0.2)), limite - jaDesb);
  if (n <= 0) {
    return { elementos, mensagem: 'O esquecimento chegou ao limite: nunca passa de metade do mundo.' };
  }
  const alvos = new Set(
    livres
      .filter((e) => !e.desbotado)
      .sort(() => rng() - 0.5)
      .slice(0, n),
  );
  return {
    elementos: elementos.map((e) => (alvos.has(e) ? { ...e, desbotado: true } : e)),
    mensagem: `A névoa voltou sobre ${n} ${n > 1 ? 'elementos' : 'elemento'}. Revise para recuperar.`,
  };
}

/** Revisar: tudo que desbotou volta e fica marcado para brilhar. */
export function revisar(elementos: Element[]): Resultado {
  const n = elementos.filter((e) => e.desbotado).length;
  if (!n) return { elementos, mensagem: 'Tudo em dia. Nada para recuperar.' };
  return {
    elementos: elementos.map((e) => (e.desbotado ? { ...e, desbotado: false, brilha: true } : e)),
    mensagem: `Revisão feita: ${n} ${n > 1 ? 'elementos voltaram' : 'elemento voltou'} a brilhar.`,
  };
}

export function contarPorTema(elementos: Element[]): Record<ThemeKey, number> {
  const contagem = Object.fromEntries(CHAVES_TEMAS.map((k) => [k, 0])) as Record<ThemeKey, number>;
  for (const e of elementos) contagem[e.tema]++;
  return contagem;
}
