// =====================================================================
// O ESTADO DAS CONQUISTAS — o que está desbloqueado e o que anunciar agora.
// Puro: cada função recebe um estado e devolve outro. O hook só os guarda.
// =====================================================================
import { conquistasAlcancadas, ehAchievementId, type AchievementId, type Nascidos } from './regras';

/** Um anúncio na fila do banner. `serie` é única por anúncio, para sempre. */
export interface Anuncio {
  id: AchievementId;
  serie: number;
}

/**
 * Duas metades com destinos diferentes, e é essa separação que impede o banner
 * de reaparecer ao abrir o app:
 *
 * - `desbloqueadas` é **da jornada**: vai para o save e volta na hidratação;
 * - `fila` e `serie` são **da sessão**: nunca são gravadas. O app abre sempre com
 *   a fila vazia, então nenhuma conquista antiga se anuncia de novo.
 */
export interface EstadoDeConquistas {
  desbloqueadas: readonly AchievementId[];
  fila: readonly Anuncio[];
  /** Contador de anúncios. Não volta a zero no reset: garante key nova ao banner. */
  serie: number;
}

/** O que vai para o disco: só o que foi conquistado. */
export interface ConquistasSalvas {
  desbloqueadas: AchievementId[];
}

/**
 * O estado ao abrir o app. A fila nasce **vazia**: conquista vinda do save já
 * foi anunciada quando aconteceu.
 *
 * Aceita qualquer coisa do disco e fica só com ids conhecidos e sem repetição.
 */
export function estadoInicial(salvas?: readonly unknown[] | null): EstadoDeConquistas {
  const conhecidas = (salvas ?? []).filter(ehAchievementId);
  return { desbloqueadas: [...new Set(conhecidas)], fila: [], serie: 0 };
}

/**
 * Algo nasceu no mundo. Se isso desbloqueia alguma conquista, ela entra nas
 * desbloqueadas **e** na fila do banner — no mesmo passo, então não existe
 * conquista anunciada que não esteja salva, nem salva que não tenha sido
 * anunciada no momento em que aconteceu.
 *
 * Sem novidade, devolve o MESMO objeto: nada re-renderiza, nada é regravado.
 */
export function registrarNascimentos(estado: EstadoDeConquistas, nascidos: Nascidos): EstadoDeConquistas {
  const novas = conquistasAlcancadas(nascidos, estado.desbloqueadas);
  if (novas.length === 0) return estado;

  const anuncios = novas.map((id, i) => ({ id, serie: estado.serie + i + 1 }));
  return {
    desbloqueadas: [...estado.desbloqueadas, ...novas],
    fila: [...estado.fila, ...anuncios],
    serie: estado.serie + novas.length,
  };
}

/**
 * O banner terminou de sair. Tira da fila **só o anúncio que terminou**: se a
 * jornada foi recomeçada no meio da animação, um aviso atrasado não pode
 * derrubar um anúncio novo que tenha entrado depois.
 */
export function concluirAnuncio(estado: EstadoDeConquistas, serie: number): EstadoDeConquistas {
  if (estado.fila[0]?.serie !== serie) return estado;
  return { ...estado, fila: estado.fila.slice(1) };
}

/** Jornada nova: nada conquistado, nada a anunciar. A série continua subindo. */
export function reiniciarConquistas(estado: EstadoDeConquistas): EstadoDeConquistas {
  if (estado.desbloqueadas.length === 0 && estado.fila.length === 0) return estado;
  return { desbloqueadas: [], fila: [], serie: estado.serie };
}

/** O anúncio no banner agora, ou `null`. Um por vez; os outros esperam. */
export function anuncioAtual(estado: EstadoDeConquistas): Anuncio | null {
  return estado.fila[0] ?? null;
}

/** A parte que vai para o save. A fila fica de fora por construção. */
export function paraSalvar(estado: EstadoDeConquistas): ConquistasSalvas {
  return { desbloqueadas: [...estado.desbloqueadas] };
}
