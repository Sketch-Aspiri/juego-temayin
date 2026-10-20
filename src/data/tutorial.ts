import type { LevelDef } from '../engine/level/types';
import type { TutorialObjective } from '../engine/tutorial';
import type { Action } from '../engine/input';

/** Fuera de la campaña: ni los resultados ni el cacao de esta sesión se persisten. */
export const TUTORIAL_LEVEL: Readonly<LevelDef> = {
  id: 'practica-toh', name: 'El claro de Toh', theme: 'jungle', width: 66,
  tutorial: true, time: 0, checkpoint: 24,
  ops: [
    ['coins', 9, 11, 3], ['plat', 15, 11, 2], ['coins', 15, 10, 2],
    ['coins', 22, 11, 4], ['plat', 30, 11, 2], ['coins', 30, 10, 2],
    ['flag', 38], ['temple', 42],
  ],
};

interface TutorialLesson {
  readonly id: TutorialObjective;
  readonly title: string;
  readonly hint: string;
  readonly actions: readonly Action[];
}

export const TUTORIAL_LESSONS: readonly TutorialLesson[] = [
  { id: 'move', title: 'Da tus primeros pasos', hint: 'Camina hacia la derecha por el claro. Puedes volver atrás cuando quieras.', actions: ['left', 'right'] },
  { id: 'jump', title: '¡Arriba, jaguar!', hint: 'Salta. Mantén el botón para llegar más alto; un toque hace un salto corto.', actions: ['jump'] },
  { id: 'run', title: 'Corre con el viento', hint: 'Combina una dirección con correr. En el mando táctil, toca Correr para activarlo.', actions: ['right', 'run'] },
  { id: 'collect', title: 'Sigue el cacao', hint: 'Toca un grano de cacao dorado. Hay más adelante y sobre los escalones; puedes regresar si lo saltaste.', actions: ['left', 'right', 'jump'] },
  { id: 'fire', title: 'Prueba el chile habanero', hint: 'Ya llevas un chile de práctica: lanza una bola de fuego. En la aventura lo encontrarás en cofres.', actions: ['fire'] },
];
