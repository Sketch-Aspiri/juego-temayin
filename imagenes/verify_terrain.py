"""Revisa el suelo pintado, la continuidad, las orillas y la simulación en Chromium."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / 'verificacion/suelo-pantano'
SCENES = [
    ('1-4', 0, 3, 'el-triunfo-inicio'),
    ('1-4', 23, 25, 'el-triunfo-orilla'),
    ('1-4', 90, 99, 'el-triunfo-checkpoint'),
    ('2-4', 0, 3, 'petenes-inicio'),
    ('2-4', 24, 26, 'petenes-orilla'),
    ('2-7', 0, 3, 'calkini-inicio'),
    ('2-7', 54, 56, 'calkini-entrada-arena'),
]
SNAPSHOT = 'JSON.stringify({grid:qa.world.grid,water:qa.world.level.water,player:qa.world.player,session:qa.world.session})'

SETUP = """async () => {
  const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
  const {World}=await import(loaded('/src/engine/World.ts'));
  const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
  const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
  const {TERRAIN_SPRITES}=await import(loaded('/src/data/terrainSprites.ts'));
  const {lazyImage}=await import(loaded('/src/engine/render/artCache.ts'));
  const {drawPaintedTerrain}=await import(loaded('/src/engine/render/mayaTiles.ts'));
  window.qa={store:useAppStore,world:null,sprites:TERRAIN_SPRITES,draw:drawPaintedTerrain};
  useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},
    settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
  World.prototype.update=function(){qa.world=this};
  const img=lazyImage(TERRAIN_SPRITES.mud.file);
  if(img)await img.decode();
  else{const probe=new Image();probe.src='/assets/'+TERRAIN_SPRITES.mud.file;await probe.decode();}
}
"""


def compare_and_mobile(page):
    # El respaldo original permite comparar el mismo encuadre sin modificar archivos.
    page.evaluate('qa.saved=[qa.sprites.mudTop,qa.sprites.mud];delete qa.sprites.mudTop;delete qa.sprites.mud')
    page.wait_for_timeout(100)
    page.locator('canvas').screenshot(path=str(OUTPUT / 'el-triunfo-antes.png'))
    page.evaluate('[qa.sprites.mudTop,qa.sprites.mud]=qa.saved')
    page.set_viewport_size({'width': 844, 'height': 390})
    page.wait_for_timeout(150)
    page.screenshot(path=str(OUTPUT / 'el-triunfo-movil.png'))
    page.set_viewport_size({'width': 1280, 'height': 850})


def capture_scene(page, scene):
    level, cam, column, label = scene
    page.evaluate('id=>{qa.world=null;qa.store.getState().startLevel(id)}', level)
    page.wait_for_function('id=>qa.world?.def.id===id', arg=level)
    page.evaluate("""({cam,column})=>{
      const w=qa.world,p=w.player;w.camX=cam*40;w.phaseT=10;
      let floor=12;while(floor>0&&w.solid(column,floor-1))floor--;
      p.x=column*40;p.y=floor*40-p.h;p.inv=0;p.anim='idle';p.frame=0;
    }""", {'cam': cam, 'column': column})
    page.wait_for_function("!document.querySelector('.level-card')||Number(getComputedStyle(document.querySelector('.level-card')).opacity)===0")
    page.wait_for_timeout(150)
    state = page.evaluate(SNAPSHOT)
    page.locator('canvas').screenshot(path=str(OUTPUT / f'{label}.png'))
    page.wait_for_timeout(100)
    unchanged = page.evaluate(SNAPSHOT) == state
    assert unchanged, label
    if label == 'el-triunfo-inicio':
        compare_and_mobile(page)
    page.evaluate("qa.store.getState().go('levels')")
    page.wait_for_timeout(50)
    return {'level': level, 'scene': label, 'simulationUnchanged': unchanged}


def verify_coverage(page):
    coverage = page.evaluate("""()=>{
          const canvas=document.createElement('canvas');canvas.width=480;canvas.height=160;
          const c=canvas.getContext('2d');
          for(let row=0;row<4;row++)for(let col=0;col<12;col++){
            if(!qa.draw(c,row?'mud':'mudTop',col*40,row*40,col,row))throw Error('Arte sin cargar');
          }
          const px=c.getImageData(0,0,480,160).data;
          let opaque=true,repeats=true;
          for(let y=0;y<160;y++)for(let x=0;x<480;x++){
            const index=(y*480+x)*4;opaque&&=px[index+3]===255;
            if(x<240)for(let k=0;k<4;k++)repeats&&=px[index+k]===px[index+240*4+k];
          }
          canvas.id='qa-terrain';canvas.style='position:fixed;left:20px;top:20px;z-index:9999;width:960px;height:320px';
          document.body.append(canvas);return {opaque,repeats};
    }""")
    page.locator('#qa-terrain').screenshot(path=str(OUTPUT / '24-sprites-continuos.png'))
    assert coverage == {'opaque': True, 'repeats': True}, coverage
    return coverage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:5197')
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1280, 'height': 850})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('response', lambda r: errors.append(f'{r.status}: {r.url}') if r.status >= 400 else None)
        page.goto(args.url)
        page.wait_for_load_state('networkidle')
        page.evaluate(SETUP)
        scenes = [capture_scene(page, scene) for scene in SCENES]
        coverage = verify_coverage(page)
        browser.close()
    payload = {'scenes': scenes, 'coverage': coverage, 'errors': errors,
               'mode': 'Escenas preparadas; tamaño real y móvil; píxeles opacos y repetición; simulación congelada para revisar el dibujo.'}
    (OUTPUT / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    assert not errors, errors
    print(json.dumps(payload, ensure_ascii=False))


if __name__ == '__main__':
    main()
