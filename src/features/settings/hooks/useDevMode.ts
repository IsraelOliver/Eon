import { useRef, useState } from 'react';

const TOQUES_PARA_ALTERNAR = 5;
const INTERVALO_MAXIMO_MS = 1500; // entre um toque e o próximo

/**
 * Modo desenvolvedor: alterna com 5 toques seguidos no ícone secreto.
 * Não é salvo: ao fechar o app volta a desativado.
 */
export function useDevMode() {
  const [ativo, setAtivo] = useState(false);
  const [aviso, setAviso] = useState({ mensagem: '', id: 0 });
  const toques = useRef({ quantidade: 0, ultimo: 0 });

  function registrarToque() {
    const agora = Date.now();
    const t = toques.current;
    t.quantidade = agora - t.ultimo <= INTERVALO_MAXIMO_MS ? t.quantidade + 1 : 1; // demorou? recomeça
    t.ultimo = agora;
    if (t.quantidade < TOQUES_PARA_ALTERNAR) return;

    t.quantidade = 0;
    const novo = !ativo;
    setAtivo(novo);
    setAviso({ mensagem: novo ? 'Modo desenvolvedor ativado' : 'Modo desenvolvedor desativado', id: aviso.id + 1 });
  }

  return { ativo, aviso, registrarToque };
}
