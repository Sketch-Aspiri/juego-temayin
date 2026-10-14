import { CINEMATICS } from '../../data/cinematics';
import { useAppStore } from '../../store/appStore';
import { CinematicPlayer } from '../components/CinematicPlayer';

/** Conserva el acceso automático al prólogo antes de empezar Palenque. */
export function IntroScreen() {
  const finishIntro = useAppStore(s => s.finishIntro);
  return <CinematicPlayer cinematic={CINEMATICS.intro} onFinish={finishIntro} finishLabel="¡A la aventura!" />;
}
