"""Comprueba consejos en partida y recorte de la morena en las cuatro direcciones."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(__file__).resolve().parent / 'verificacion' / 'mundo2-ajustes'
out.mkdir(parents=True, exist_ok=True)
errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('response', lambda response: errors.append(f'{response.status}: {response.url}') if response.status >= 400 else None)
    page.goto('http://127.0.0.1:5197')
    page.wait_for_load_state('networkidle')
    page.evaluate("""async () => {
      const loaded=s=>performance.getEntriesByType('resource').filter(e=>new URL(e.name).pathname===s).at(-1)?.name||s;
      const {World}=await import(loaded('/src/engine/World.ts'));
      const {useAppStore}=await import(loaded('/src/store/appStore.ts'));
      const {ALL_LEVELS}=await import(loaded('/src/data/worlds.ts'));
      window.qa={store:useAppStore,world:null};
      useAppStore.setState({progress:{levels:Object.fromEntries(ALL_LEVELS.map(l=>[l.id,{bestScore:0,stars:1,completions:1}]))},settings:{...useAppStore.getState().settings,muted:true,introSeen:true}});
      const update=World.prototype.update;
      World.prototype.update=function(dt){qa.world=this;return update.call(this,dt)};
      window.hintTexts=[];
      const fillText=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(text.startsWith('Toh: '))hintTexts.push(text);return fillText.call(this,text,...args)};
    }""")
    hints = []
    for level in [f'2-{i}' for i in range(1, 8)]:
        page.evaluate('id=>{hintTexts.length=0;qa.store.getState().startLevel(id)}', level)
        page.wait_for_function('id=>qa.world?.def.id===id&&hintTexts.length>0', arg=level)
        page.wait_for_timeout(100)
        hints.append(page.evaluate('()=>({id:qa.world.def.id,text:hintTexts.at(-1)})'))
        if level in ['2-4', '2-7']:
            page.screenshot(path=str(out / f'{level}-toh.png'))
        page.evaluate("qa.store.getState().go('levels')")
        page.wait_for_timeout(50)
    report = page.evaluate("""async () => {
      const {drawMoray}=await import('/src/engine/render/enemies/moray.ts');
      const {MORAY,morayLair}=await import('/src/engine/entities/enemies/moray.ts');
      const {createEnemy}=await import('/src/engine/entities/enemies/index.ts');
      const {lazyImage}=await import('/src/engine/render/artCache.ts');
      const img=lazyImage('enemies/moray.webp');
      if(!img) throw Error('La hoja pintada no está cargada');
      const board=document.createElement('div');board.id='qa-moray';
      board.style='position:fixed;inset:0;z-index:99999;background:#18312e;display:grid;grid-template-columns:repeat(4,300px);grid-template-rows:repeat(4,220px)';
      const directions=[[1,0],[-1,0],[0,1],[0,-1]], poses=[[0,-40],[1,-20],[2,70],[3,15]], report=[];
      for(const [dx,dy] of directions)for(const [state,ext] of poses){
        const canvas=document.createElement('canvas');canvas.width=300;canvas.height=220;
        const c=canvas.getContext('2d'),e=createEnemy({id:'moray',tx:4,ty:9});
        const world={solid:(x,y)=>(x===4-dx&&y===9-dy),player:{x:0,y:0,w:20,h:20}};
        MORAY.move(e,world,0);const lair=morayLair(e);lair.ext=ext;e.state=state;
        c.save();c.translate(150+dx*ext,110+dy*ext+e.h/2);drawMoray(c,{},e);c.restore();
        const px=c.getImageData(0,0,300,220).data;let leak=0,visible=0;
        for(let y=0;y<220;y++)for(let x=0;x<300;x++)if(px[(y*300+x)*4+3]>0){visible++;if((x-150)*dx+(y-110)*dy < -29)leak++}
        report.push({dx,dy,state,ext,leak,visible});
        c.strokeStyle='#85bdaf';c.lineWidth=1;c.beginPath();
        if(dx){c.moveTo(150-dx*20,30);c.lineTo(150-dx*20,195)}
        else{c.moveTo(30,110-dy*20);c.lineTo(270,110-dy*20)}c.stroke();
        c.fillStyle='#fff';c.font='14px sans-serif';c.fillText(`Salida (${dx}, ${dy}), pose ${state}`,12,20);
        board.append(canvas);
      }
      document.body.append(board);return report;
    }""")
    page.screenshot(path=str(out / 'morena-direcciones.png'))
    browser.close()
payload = {'hints': hints, 'moray': report, 'errors': errors}
(out / 'revision.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
assert not errors, errors
assert len(hints) == 7, hints
assert len(report) == 16 and all(r['leak'] == 0 for r in report), report
assert all(r['visible'] > 300 for r in report if r['state'] == 2), report
print('Siete consejos visibles; morena recortada en cuatro orientaciones; sin errores.')
