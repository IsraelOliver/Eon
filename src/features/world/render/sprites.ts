import type { SpriteKey } from '../engine/types';

// Cada letra é uma cor da paleta SPAL, "." é transparente. É o desenho de
// RESERVA de quem não tem PNG. Ausente = não desenha nada (as especializações
// sem arte ainda: nada de placeholder inventado).
export const SPRITES: Partial<Record<SpriteKey, string[]>> = {
  casa: ['...R...', '..RrR..', '.RrrrR.', 'RrrrrrR', '.wwwww.', '.wdwww.', '.wdwww.'],
  // Desenhos de reserva enquanto o PNG não carrega (as vilas usam os PNGs diagonais).
  casa_maior: ['...R...', '..RrR..', '.RrrrR.', 'RrrrrrR', '.wwwww.', '.wdwdw.', '.wwwww.', '.wdwdw.', '.wwdww.'],
  fonte: ['..s..', '.wgw.', 'wgggw', '.www.'],
  // Reservas enquanto o PNG do marco não carrega.
  cabana: ['...R...', '..RRR..', '.RRrRR.', 'RRRrRRR', '.wwdww.'],
  fogueira: ['..R..', '.RrR.', '.RrR.', 'n.n.n', '.nnn.'],
  observatorio: ['....s..', '..ggg..', '.ggggg.', '.wwwww.', '.wwdww.', '.wwdww.'],
  mina: ['.bbbbb.', 'bkkkkkb', 'bkkkkkb', 'bkkkkkb', 'ooooooo'],
  arvore: ['..TTT..', '.TTtTT.', 'TtTttTt', 'ttttttt', '.ttttt.', '...n...', '...n...'],
  pinheiro: ['...p...', '..ppp..', '..ppp..', '.ppppp.', '.ppppp.', 'ppppppp', '...n...'],
  cacto: ['...c...', '.c.c...', '.ccc.c.', '...ccc.', '...c...', '...c...'],
  acacia: ['.TTTTT.', 'TtttttT', '...n...', '...n...', '..n....'],
  // Provisórios até existir PNG de pedra e arbusto
  pedra: ['..oo..', '.oooo.', 'oooooo'],
  arbusto: ['..t..', '.tTt.', 'ttttt'],
};
