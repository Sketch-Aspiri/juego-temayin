import { describe, expect, it } from 'vitest';
import { parseBuildInfo } from '../../scripts/buildInfo';

const COMMIT = 'e4e120e76da41ae44ba5dafedc33cd2fdf7fb88a';

describe('Versión incluida en la compilación', () => {
  it('conserva el commit exacto y convierte el asunto y cuerpo en notas legibles', () => {
    const info = parseBuildInfo(`${COMMIT}\r\nfeat(suelo): mejora el pantano\r\n\r\n- Añade césped y raíces.\r\n- Mantiene el suelo continuo.\r\n`);
    expect(info).toEqual({ commit: COMMIT, summary: 'mejora el pantano', changes: ['Añade césped y raíces.', 'Mantiene el suelo continuo.'] });
  });

  it('utiliza el asunto aunque el commit no tenga notas adicionales', () => {
    expect(parseBuildInfo(`${COMMIT}\nfix: corrige las orillas\n`).summary).toBe('corrige las orillas');
    expect(parseBuildInfo(`${COMMIT}\nfix: corrige las orillas\n`).changes).toEqual([]);
  });

  it('permite publicar fuentes sin .git con metadatos explícitos de esa versión', () => {
    expect(parseBuildInfo('', {
      TEMAYIN_BUILD_COMMIT: COMMIT,
      TEMAYIN_BUILD_SUMMARY: 'Mejora el suelo del pantano',
      TEMAYIN_BUILD_CHANGES: '- Añade 24 sprites.\n\n- Conserva las colisiones.',
    })).toEqual({ commit: COMMIT, summary: 'Mejora el suelo del pantano', changes: ['Añade 24 sprites.', 'Conserva las colisiones.'] });
  });

  it.each(['', 'sin git\nCambio desconocido', 'javascript:alert(1)\nCambio'])('no inventa una revisión para %j', log => {
    expect(parseBuildInfo(log)).toEqual({ commit: null, summary: 'Información de versión no disponible.', changes: [] });
  });
});
