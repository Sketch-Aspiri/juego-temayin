async () => {
  const loaded = path => performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname === path).at(-1)?.name ?? path;
  const { World } = await import(loaded('/src/engine/World.ts'));
  const { useAppStore } = await import(loaded('/src/store/appStore.ts'));
  const { ALL_LEVELS, WORLDS } = await import(loaded('/src/data/worlds.ts'));
  const { artReady } = await import(loaded('/src/engine/render/artCache.ts'));
  const { WORLD7_ART_FILES } = await import(loaded('/src/data/world7Art.ts'));
  const { driveWorld7Route } = await import('/src/engine/testing/world7Route.ts');
  const { driveCamazotzBattle } = await import('/src/engine/testing/camazotzBattle.ts');
  await artReady(WORLD7_ART_FILES);
  const record = { stars: 2, completions: 1, bestScore: 2000 };
  useAppStore.setState({ progress: { levels: Object.fromEntries(ALL_LEVELS.filter(level => !level.id.startsWith('7-')).map(level => [level.id, record])), tickets: [] },
    settings: { ...useAppStore.getState().settings, muted: true, introSeen: true } });
  const qa = window.world7qa = { store: useAppStore, world: null, hold: false, driving: false, mode: 'route', pending: null, shots: [], metrics: {}, errors: [] };
  const original = World.prototype.update;
  const screenshot = (name, test) => ({ name, test, done: false });
  qa.start = id => {
    qa.store.getState().go('levels');
    qa.world = null; qa.hold = false; qa.driving = true; qa.mode = 'route'; qa.pending = null;
    qa.metrics = { level: id, checkpoint: false, deaths: 0, simulated: 0, stages: [], echoes: [] };
    qa.shots = [
      screenshot('inicio', world => world.player.x > 9 * 40),
      screenshot('checkpoint', world => world.checkpointReached),
      screenshot('meta', world => world.phase === 'flag' && world.phaseT > 0.7),
    ];
    if (id === '7-4') qa.shots.splice(2, 0,
      screenshot('presentacion', world => world.boss?.intro && world.boss.t > 0.5),
      screenshot('aviso-picada', world => world.boss?.st === 'diveWarn' && world.boss.t > 0.35),
      screenshot('picada-en-vuelo', world => world.boss?.st === 'dive' && world.boss.t > 0.25),
      screenshot('picada-tercera', world => world.boss?.st === 'diveWarn' && world.boss.diveCount === 2 && world.boss.t > 0.4),
      screenshot('enjambre', world => world.boss?.st === 'swarm' && world.boss.t > 1.1),
      screenshot('viento-y-ondas', world => world.boss?.st === 'gust' && world.boss.t > 1.2),
      screenshot('lluvia-camara', world => world.boss?.phase === 2 && world.boss.hazards.some(h => h.kind === 'shard' && h.age > h.delay)),
      screenshot('rayo-triple', world => world.boss?.st === 'beam' && world.boss.beamCount === 2 && world.boss.t > 0.2),
      screenshot('ventana-pisoton', world => world.boss?.hittable && world.boss.phase === 1 && world.boss.t > 0.3),
      screenshot('descenso-camara', world => world.boss?.phase === 2 && world.boss.st === 'transition' && world.boss.t > 0.5),
      screenshot('camara-antorchas', world => world.boss?.phase === 2 && world.boss.litTorches >= 1),
      screenshot('aviso-rayo', world => world.boss?.st === 'beamWarn' && world.boss.t > 0.5),
      screenshot('rayo-y-pilares', world => world.boss?.st === 'beam' && world.boss.t > 0.2),
      ...Array.from({ length: 6 }, (_, echo) => screenshot(`eco-${echo + 1}`, world => world.boss?.st === 'echoWarn' && world.boss.echo === echo && world.boss.t > 0.35)),
      screenshot('amanecer-muro-abierto', world => world.boss?.st === 'gone' && world.phase === 'play'));
    qa.store.getState().startLevel(id);
    if (qa.store.getState().screen === 'offering') qa.store.getState().continueOffering();
  };
  qa.resume = () => { qa.pending = null; qa.hold = false; };
  qa.prepareTicket = () => {
    qa.start('7-3'); qa.mode = 'ticket';
    qa.shots = [screenshot('boleto-recogido', world => world.ticketCollected)];
  };
  World.prototype.update = function(dt) {
    qa.world = this;
    if (qa.hold) return;
    for (let step = 0; step < (qa.driving ? 14 : 1); step++) {
      if (qa.driving && this.phase === 'play') control(this);
      const previousPhase = this.phase;
      original.call(this, dt);
      qa.metrics.simulated = (qa.metrics.simulated ?? 0) + dt;
      qa.metrics.checkpoint ||= this.checkpointReached;
      if (this.boss && !qa.metrics.stages.includes(this.boss.stage)) qa.metrics.stages.push(this.boss.stage);
      if (this.boss?.st === 'echo' && !qa.metrics.echoes.includes(this.boss.echo)) qa.metrics.echoes.push(this.boss.echo);
      if (previousPhase === 'play' && this.phase === 'dying') qa.metrics.deaths++;
      for (const shot of qa.shots) {
        if (shot.done || !shot.test(this)) continue;
        shot.done = true; qa.pending = shot.name; qa.hold = true; break;
      }
      if (qa.hold || this.phase === 'dying' || this.phase === 'done') break;
    }
  };
  function control(world) {
    if (qa.mode === 'ticket') {
      if (!qa.ticketPrepared) {
        world.player.x = 151 * 40; world.player.y = 6 * 40 - world.player.h;
        world.player.vx = 0; world.player.vy = 0; world.player.onGround = true;
        world.camX = 140 * 40; world.input.reset(); qa.ticketPrepared = true;
      }
      world.player.inv = 2; world.input.press('right'); world.input.press('jump');
      return;
    }
    if (world.def.id === '7-4') driveCamazotzBattle(world);
    else driveWorld7Route(world);
  }
  qa.report = () => ({ ...qa.metrics, phase: qa.world?.phase, hp: qa.world?.boss?.hp,
    shots: qa.shots.filter(shot => shot.done).map(shot => shot.name), progress: qa.store.getState().progress });
  qa.worlds = WORLDS.map(world => world.id);
}
