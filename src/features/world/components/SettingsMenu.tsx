import { useState } from 'react';

import { Button } from '@/shared/ui/Button';
import { FloatingButton } from '@/shared/ui/FloatingButton';
import { ICONS } from '@/shared/ui/icons';
import { Window } from '@/shared/ui/Window';

type Props = {
  onNovoMundo: () => void;
};

/** Engrenagem (superior esquerdo) + janela "Configurações". A ação fecha a janela. */
export function SettingsMenu({ onNovoMundo }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <FloatingButton icon={ICONS.gear} corner="top-left" accessibilityLabel="Abrir configurações" onPress={() => setAberto(true)} />
      <Window visible={aberto} title="Configurações" onClose={() => setAberto(false)}>
        <Button
          label="Novo mundo"
          onPress={() => {
            setAberto(false);
            onNovoMundo();
          }}
        />
      </Window>
    </>
  );
}
