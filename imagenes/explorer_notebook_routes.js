/** Piloto de QA: elige entradas con copias de la física; no teletransporta el recorrido. */
async () => {
  const loaded = path => performance.getEntriesByType('resource').filter(item => new URL(item.name).pathname === path).at(-1)?.name ?? path;
  const { World } = await import(loaded('/src/engine/World.ts'));
  const { Input } = await import(loaded('/src/engine/input.ts'));
  const { AudioEngine } = await import(loaded('/src/engine/audio.ts'));
  const STEP = 1 / 120;
  const base = { run: true, rightSteps: 999, jumpHold: 0, steps: 24, untilLand: false };
  const actions = [base,
    ...[2, 10, 20, 32, 48, 80].flatMap(hold => [999, 20, 40, 60].map(right => ({ ...base, jumpHold: hold, rightSteps: right, steps: 220, untilLand: true }))),
    ...[10, 32, 80].map(hold => ({ ...base, run: false, jumpHold: hold, steps: 220, untilLand: true })),
    ...[20, 80].map(hold => ({ ...base, rightSteps: 0, jumpHold: hold, steps: 220, untilLand: true }))];

  function clone(source) {
    const audio = new AudioEngine(); audio.muted = true;
    const copy = new World({ def: source.def, input: new Input(), audio, session: { ...source.session }, discoveries: source.discoveries });
    Object.assign(copy.player, source.player);
    copy.camX = source.camX; copy.timeLeft = source.timeLeft;
    copy.checkpointReached = source.checkpointReached;
    for (let y = 0; y < copy.grid.length; y++) copy.grid[y].splice(0, copy.grid[y].length, ...source.grid[y]);
    for (const key of ['platforms', 'crumbles', 'enemies', 'items', 'cannons', 'cannonballs']) copy[key] = source[key].map(entity => ({ ...entity }));
    return copy;
  }

  function apply(world, action, step) {
    const input = world.input;
    if (action.run) input.press('run'); else input.release('run');
    if (step < action.rightSteps) input.press('right'); else input.release('right');
    if (step < action.jumpHold) input.press('jump'); else input.release('jump');
  }

  function trial(source, action) {
    const copy = clone(source); copy.input.reset();
    let airborne = false;
    for (let step = 0; step < action.steps; step++) {
      copy.player.inv = 1; apply(copy, action, step); qa.tick.call(copy, STEP);
      if (copy.phase === 'dying') return null;
      if (copy.phase !== 'play') return { x: Infinity, steps: step + 1 };
      if (!copy.player.onGround) airborne = true;
      if (action.untilLand && airborne && step > 3 && (copy.player.onGround || copy.player.swimming)) return { x: copy.player.x, steps: step + 1 };
    }
    return copy.player.onGround || copy.player.swimming ? { x: copy.player.x, steps: action.steps } : null;
  }

  function controlGround(world) {
    if (!qa.plan || qa.plan.step >= qa.plan.steps) {
      let best = null;
      for (const action of actions) {
        const result = trial(world, action);
        if (result && (!best || result.x > best.x)) best = { action, ...result };
      }
      qa.plan = best ? { ...best, step: 0 } : { action: { ...base, rightSteps: 0 }, steps: 12, step: 0 };
      world.input.reset();
    }
    world.player.inv = 1;
    apply(world, qa.plan.action, qa.plan.step++);
  }

  function controlLagoon(world) {
    const player = world.player, input = world.input;
    player.inv = 1; input.press('right'); input.press('run');
    const center = player.x + player.w / 2, front = player.x + player.w;
    const water = world.level.water.find(zone => center / 40 >= zone.x0 && center / 40 < zone.x1 + 1);
    let jump = false;
    if (player.swimming && water) {
      jump = player.y > water.surface * 40 - 50 && player.vy >= 0;
      if (center < water.x1 * 40 - 100) jump = player.y + player.h > (world.level.water.indexOf(water) === 0 ? 11.8 : 10.9) * 40;
      const tx = Math.floor(front / 40);
      if (world.solid(tx, Math.floor((player.y + player.h - 3) / 40)) && !world.solid(tx, Math.floor(player.y / 40))) jump = true;
    } else if (player.onGround || player.coyote > 0) {
      for (let x = Math.floor(front / 40); x <= Math.floor((front + 60) / 40); x++)
        if (!world.solid(x, 12) || world.solid(x, Math.floor((player.y + player.h - 3) / 40))) jump = true;
    }
    if (jump && !input.held.jump) input.press('jump');
    else if (player.vy >= 0 || (!jump && player.onGround)) input.release('jump');
  }

  qa.route = fromCheckpoint => {
    const source = qa.world;
    const world = fromCheckpoint ? new World({ def: source.def, input: new Input(), audio: source.audio,
      session: { ...source.session }, fromCheckpoint: true, discoveries: source.discoveries }) : source;
    qa.plan = null;
    for (let step = 0; step < 24000 && world.phase === 'play'; step++) {
      if (world.def.id === '6-5') controlLagoon(world); else controlGround(world);
      qa.tick.call(world, STEP);
    }
    const report = { level: world.def.id, fromCheckpoint, phase: world.phase, checkpoint: world.checkpointReached,
      x: world.player.x / 40, discoveries: world.discoveries, damaged: world.stromatolites.some(segment => segment.damaged) };
    for (let step = 0; step < 3000 && world.phase === 'flag'; step++) qa.tick.call(world, STEP);
    report.phase = world.phase;
    return report;
  };
}
