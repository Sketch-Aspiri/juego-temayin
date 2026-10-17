"""Captura todas las acciones de Lorencillo en ambas fases y dos tamaños táctiles.

Las escenas se preparan; no sustituyen el recorrido de verify_world6.py ni miden dificultad humana.
Uso: python imagenes/verify_lorencillo_visuals.py (Vite en el puerto 5197).
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps
from playwright.sync_api import sync_playwright
import verify_world6 as world6

OUT = Path(__file__).resolve().parent / 'verificacion/mundo6/lorencillo'
SCENE = r"""async ([state,phase,face])=>{
  const w=qa.world,b=w.boss,p=w.player;
  qa.hold=true;qa.drive=false;w.shake=0;w.phase='play';
  w.camX=155*40;w.popups=[];w.particles=[];w.enemies=[];
  w.fireballs=[];w.balls=[];b.crabs=[];b.shells=[];
  b.phase=phase;b.hp=phase===1?8:4;b.face=face;b.st=state;b.t=.25;b.clock=5;
  b.x=167*40;b.y=480-b.h;b.tilt.phase='rest';b.tilt.t=0;
  p.x=158*40;p.y=480-p.h;p.vx=p.vy=0;p.inv=0;p.shield=p.fire=p.ball=false;
  if(state==='mast'){
    b.x=(156+22*.35)*40-b.w/2;b.y-=200;b.t=1.0;
    const {throwCrab}=await import('/src/engine/bosses/lorencillo/hazards.ts');
    throwCrab(w,b.crabs,b.x+b.w/2,face,b.arena,280-40);
  }
  if(state==='cannon'){
    const {fireSalvo}=await import('/src/engine/bosses/lorencillo/hazards.ts');
    fireSalvo(b.shells,156*40+22*40*.16,161*40,156*40,178*40,phase,()=>.5,w);
    b.shells[0].t=b.shells[0].warn+.45;
  }
  if(state==='lunge')b.x=165*40;
  if(state==='rally'){b.t=.7;b.x=166*40;}
  if(state==='exposed')b.x=166*40;
  if(state==='dead')b.hp=0;
  if(phase===2&&state!=='rally'&&state!=='dead'){
    b.tilt.phase='active';b.tilt.dir=face;b.tilt.t=1.2;
  }
}"""


def start(page):
    page.evaluate("qa.store.getState().startLevel('6-6');qa.store.getState().continueOffering()")
    page.wait_for_function("qa.world?.def.id==='6-6'")
    page.wait_for_timeout(3200)


def capture(page, state, phase, face=1, prefix=''):
    page.evaluate(SCENE, [state, phase, face])
    page.wait_for_timeout(180)
    name = f'{prefix}fase{phase}-{state}-{"derecha" if face>0 else "izquierda"}.png'
    page.screenshot(path=str(OUT / name))
    return name


def contact_sheet(names):
    columns, width, height = 3, 480, 340
    sheet = Image.new('RGB', (columns * width, ((len(names)+columns-1)//columns)*height), '#152d29')
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(names):
        x, y = (index % columns)*width, (index // columns)*height
        draw.text((x+8, y+5), name.removesuffix('.png'), fill='#fce6ae')
        sheet.paste(ImageOps.contain(Image.open(OUT / name), (width-8, height-24)), (x+4, y+24))
    sheet.save(OUT / 'repaso-lorencillo.jpg', quality=92)


def world_sheet():
    """Resumen de las capturas reales de los seis niveles, sin carteles de entrada."""
    files = ['6-1-viento-termica.png', '6-2-fondo-movil-b.png', '6-3-cenote-2.png',
             '6-4-luciernaga-borde.png', '6-5-laguna-A.png', '6-6-fase2-inclinacion.png']
    sheet = Image.new('RGB', (1280, 1290), '#152d29')
    draw = ImageDraw.Draw(sheet)
    for index, name in enumerate(files):
        x, y = (index % 2)*640, (index // 2)*430
        draw.text((x+10, y+6), name.removesuffix('.png'), fill='#fce6ae')
        sheet.paste(ImageOps.contain(Image.open(OUT.parent / name), (630, 400)), (x+5, y+25))
    sheet.save(OUT.parent / 'repaso-mundo6.jpg', quality=92)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names, phones = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = world6.new_page(browser, viewport={'width': 1280, 'height': 850})
        start(page)
        for phase in (1, 2):
            for state in ('idle', 'advance', 'warn', 'lunge', 'exposed', 'cannon', 'mast', 'hurt', 'dead'):
                names.append(capture(page, state, phase))
        names.append(capture(page, 'rally', 2))
        names.append(capture(page, 'lunge', 2, -1))
        page.close()
        for label, width, height in [('horizontal', 844, 390), ('vertical', 390, 844)]:
            mobile = world6.new_page(browser, viewport={'width': width, 'height': height},
                                    is_mobile=True, has_touch=True, device_scale_factor=1)
            start(mobile)
            capture(mobile, 'cannon', 2, prefix='movil-'+label+'-')
            phones.append(mobile.evaluate("""()=>({width:innerWidth,height:innerHeight,
              overflow:document.documentElement.scrollWidth>innerWidth,
              touch:document.querySelectorAll('.touch button').length,
              canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()})"""))
            mobile.close()
        browser.close()
    contact_sheet(names)
    world_sheet()
    report = {'escenas': names, 'movil': phones, 'errores': world6.errors,
              'alcance': 'Escenas preparadas; cobertura visual de poses, orientación, avisos y fases.'}
    (OUT / 'informe.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False))
    assert not world6.errors, world6.errors
    assert all(not phone['overflow'] and phone['canvas']['width']>0 and phone['touch']==5 for phone in phones), phones


if __name__ == '__main__':
    main()
