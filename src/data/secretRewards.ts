import { BONUS_LEVELS } from './worlds';

/** Cacao que concede completar por primera vez un nivel secreto (aparte del que se recoge en el camino). */
export const SECRET_CACAO = 100;
/** El santuario final, con dos acertijos, paga más. */
export const FINAL_SECRET_CACAO = 150;
export const FINAL_SECRET_ID = '7-extra';

export const SECRET_LEVEL_IDS: readonly string[] = BONUS_LEVELS.map(level => level.id);

/** Premio de fantasía por los siete sellos de jade; el récord de los siete secretos es su prueba. */
export const JADE_HEART_REWARD = {
  name: 'Corazón de jade',
  description: 'Empiezas cada nivel con una vida extra.',
  detail: 'Permanente. Se obtiene al completar los siete niveles secretos y se entrega al entrar o reiniciar un nivel de campaña o secreto.',
} as const;
