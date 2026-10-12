"""Revisa las orillas de todos los niveles con agua y mide el degradado real en Chromium."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'verificacion' / 'agua-suave'
OUTPUT.mkdir(parents=True, exist_ok=True)
errors = []

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1100, 'height': 700})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
    page.goto(os.environ.get('TEMAYIN_QA_URL', 'http://127.0.0.1:5197'))
    page.wait_for_load_state('networkidle')
    levels = page.evaluate("""async () => {
      const load=path=>import(performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===path).at(-1)?.name||path);
      const [{World},{Renderer},{Input},{AudioEngine},{loadAssets},{ALL_LEVELS},cache,{WaterSurfaceRenderer},{THEMES}]=await Promise.all([
        load('/src/engine/World.ts'),load('/src/engine/render/Renderer.ts'),load('/src/engine/input.ts'),
        load('/src/engine/audio.ts'),load('/src/engine/assets.ts'),load('/src/data/worlds.ts'),
        load('/src/engine/render/artCache.ts'),load('/src/engine/render/waterSurface.ts'),load('/src/engine/render/themes.ts')
      ]);
      const assets=await loadAssets();cache.warmArt();
      window.qa={World,Renderer,Input,AudioEngine,ALL_LEVELS,assets,cache,WaterSurfaceRenderer,THEMES};
      qa.makeWorld=def=>{const audio=new AudioEngine();audio.muted=true;return new World({def,audio,input:new Input(),session:{score:0,coins:0,lives:3}})};
      document.body.replaceChildren();document.body.style.cssText='margin:0;background:#12382f;display:grid;place-items:center;height:100vh';
      qa.canvas=document.createElement('canvas');qa.canvas.width=960;qa.canvas.height=560;document.body.append(qa.canvas);
      qa.renderer=new Renderer(qa.canvas,assets);
      return ALL_LEVELS.filter(def=>qa.makeWorld(def).level.water.length||THEMES[def.theme].water).map(def=>def.id);
    }""")
    page.wait_for_function('qa.cache.PAINTED_ART.every(file=>qa.cache.lazyImage(file))')
    pixels = page.evaluate("""() => {
      const canvas=document.createElement('canvas');canvas.width=960;canvas.height=560;
      const c=canvas.getContext('2d'),renderer=new qa.WaterSurfaceRenderer();
      const zones=[{x0:2,x1:8,surface:5}],style=qa.THEMES.reef.water;
      renderer.draw(c,zones,style,0,1);
      const alpha=(x,y)=>c.getImageData(x,y,1,1).data[3];
      const left=[79,80,82,88,96,112,128].map(x=>alpha(x,280));
      const right=[311,328,344,352,358,359,360].map(x=>alpha(x,280));
      const depth=[195,207,215,225,240,255].map(y=>alpha(200,y));
      const before=Array.from(c.getImageData(0,0,960,560).data);
      c.clearRect(0,0,960,560);
      renderer.draw(c,[{x0:2,x1:4,surface:5},{x0:5,x1:8,surface:5}],style,0,1);
      const joined=Array.from(c.getImageData(0,0,960,560).data);
      const joinedIdentical=before.every((value,i)=>value===joined[i]);
      c.clearRect(0,0,960,560);c.fillStyle='#b27c43';c.fillRect(0,0,960,560);
      renderer.draw(c,zones,style,0,1);
      const dryPixel=Array.from(c.getImageData(400,280,1,1).data);
      c.clearRect(0,0,960,560);
      renderer.draw(c,[{x0:2,x1:2,surface:5}],style,0,1);
      const narrowPoolAlpha=alpha(100,280);
      c.clearRect(0,0,960,560);
      const grid=Array.from({length:14},()=>Array(24).fill(' '));grid[7][5]='G';
      renderer.draw(c,zones,style,0,1,grid);
      return {left,right,depth,joinedIdentical,dryPixel,narrowPoolAlpha,solidAlpha:alpha(220,300),waterAlpha:alpha(260,300)};
    }""")
    reports = []
    for level in levels:
        report = page.evaluate("""id => {
          const def=qa.ALL_LEVELS.find(l=>l.id===id),w=qa.makeWorld(def);
          const zone=w.level.water.find(z=>z.x1+1<def.width-3)||w.level.water[0];
          const edge=zone?zone.x1+1:Math.floor(def.width/2);
          w.camX=Math.max(0,Math.min((edge-11)*40,def.width*40-960));w.phaseT=10;
          w.player.x=Math.min((edge+1)*40,def.width*40-120);
          let floor=12;while(floor>0&&w.solid(Math.floor(w.player.x/40),floor-1))floor--;
          w.player.y=floor*40-w.player.h;
          for(const e of w.enemies)e.active=true;
          const state=()=>JSON.stringify({water:w.level.water,player:w.player,grid:w.grid,platforms:w.platforms,session:w.session});
          const before=state();qa.renderer.render(w,1000,false);
          return {id,theme:def.theme,zones:w.level.water.length,shore:edge,simulationUnchanged:before===state()};
        }""", level)
        reports.append(report)
        page.screenshot(path=str(OUTPUT / f'{level}-orilla.png'))
    browser.close()

assert not errors, errors
assert all(report['simulationUnchanged'] for report in reports), reports
assert pixels['left'][0] == 0 and pixels['left'][-1] > 60, pixels
assert all(a <= b for a, b in zip(pixels['left'], pixels['left'][1:])), pixels
assert all(a >= b for a, b in zip(pixels['right'], pixels['right'][1:])), pixels
assert pixels['right'][-1] == 0, pixels
assert all(a <= b for a, b in zip(pixels['depth'], pixels['depth'][1:])), pixels
assert pixels['joinedIdentical'] and pixels['dryPixel'] == [178, 124, 67, 255], pixels
assert pixels['narrowPoolAlpha'] > 60, pixels
assert pixels['solidAlpha'] == 0 and pixels['waterAlpha'] > 60, pixels
(OUTPUT / 'resultado.json').write_text(json.dumps({'levels':reports,'pixels':pixels,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(reports)} niveles revisados; degradados continuos, zonas contiguas sin costuras y simulación intacta.')
