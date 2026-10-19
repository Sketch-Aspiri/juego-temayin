# Mundo 7 · Calakmul

El último tramo comienza al completar Chetumal (`6-6`). Los ids anteriores y la clave `temayin:v3` se conservan: no hace falta reiniciar el progreso.

| Nivel | Recorrido | Checkpoint | Tiempo |
|---|---|---|---|
| `7-1` · Xpujil | Columnas, losas frágiles y saltos entre ruinas; las tres torres Río Bec son decorado intacto | 88 | 360 s |
| `7-2` · Conhuas | Caverna oscura con luciérnagas, enjambres, estalactitas y escorpiones | 100 | 380 s |
| `7-3` · Calakmul | Selva nocturna, cuerdas y ascenso opcional al boleto; existe un paso inferior si se falla el sendero alto | 104 | 420 s |
| `7-4` · Trono de Camazotz | Aproximación, poderes de repuesto y combate final en la arena 90–112 | 56 | 720 s |
| `7-extra` · El santuario del Sol de Jade | Desvío de fantasía con luces, plataformas y un corazón de jade | 66 | 300 s |

El boleto de `7-3` está en columna 154, fila 4. Se alcanza por plataformas escalonadas desde la columna 140. Su recogida abre el secreto y se guarda inmediatamente. Calakmul y Trono tienen encuentro previo con Ek Chuah.

## Camazotz

Quince PV, cinco por fase. Solo recibe daño al estar expuesto: un pisotón descendente o dos impactos de fuego en la misma apertura. Cada ventana permite perder un solo PV. Cada picada y rayo avisa durante 0,85 s; las aperturas duran 2,5 / 2,25 / 2 s según la fase. Los controles siguen siendo los habituales del juego.

1. **Señor de la Noche.** Encadena dos picadas, tres desde 12 PV; cada una fija y anuncia su destino. Los aterrizajes intermedios crean ondas y solo el último abre la ventana. Alterna con dos oleadas de murciélagos que dejan una altura libre y viento acompañado de ondas.
2. **Cámara de Xibalbá, a diez PV.** El suelo ficticio baja un bloque. Enciende cuatro antorchas mientras esquivas lluvias de tres fragmentos y proyectiles dirigidos. Cada lluvia marca sus destinos un segundo antes de caer y deja huecos. Al encenderlas, Camazotz desciende durante 0,6 s antes de exponer el cuerpo. Recibes fuego al entrar; el brasero izquierdo permite recuperarlo. Las antorchas se apagan después de cada ventana.
3. **El Eclipse, a cinco PV.** Recoge tres luces elevadas saltando y resiste dos ecos para cargar el Sol de Jade. Encadena dos rayos alternando dirección, tres desde 2 PV, con aviso independiente. El rayo termina exactamente en la cara del primer pilar sólido. Los seis ecos tienen ataques propios: púas, olas opuestas, abanico de fuegos fatuos, ondas rápidas, lluvia de sargazo con pasillo y cañonazos cruzados.

Las transiciones protegen temporalmente al jugador. Al derrotarlo se retiran los peligros y la oscuridad, aparece el premio, abre el muro y amanece hasta la bandera. La victoria activa cuatro escenas: liberación, abrazo, regreso por Centenario a Escárcega y agradecimiento final. Se pueden omitir o volver a ver desde Historia sin duplicar la finalización.

## Arte y lugares

El combate utiliza ocho poses nuevas, aleteo animado, anclas corporales, estelas de picada y efectos nuevos de rayo, orbe y onda. Los originales históricos se conservan para la historia. `camazotzArt.ts` registra recortes y anclas; `python imagenes/import_camazotz_art.py` exporta los dos atlas WebP sin pérdidas y verifica igualdad RGBA. [Prompts nuevos](../../../../imagenes/nuevos/mundo7/camazotz-v2-prompts.json) y [arte anterior](../../../../imagenes/nuevos/mundo7/PROMPTS.md).

Xpujil toma como referencia el edificio de tres torres y el estilo Río Bec descritos por el [INAH](https://lugares.inah.gob.mx/es/node/4364). La selva y su fauna se apoyan en la [Reserva de Calakmul, CONANP](https://conanp.gob.mx/conanp/dominios/calakmul/biodiversidad.php), y el entorno de Conhuas en el [estudio de Balam Kú](https://www.conanp.gob.mx/pdf/separata/EPJ-RB-BalamKu.pdf). El trono, la cámara y su descenso son fantasía; el juego no representa la destrucción de un monumento real. El mapa distingue estación de Calakmul, localidad de Conhuas y ubicación ficticia del trono.

## Verificación

`World7.test.ts` recorre inicio y checkpoint de los niveles, el camino del boleto y las tres fases hasta la bandera. `bosses/camazotz/camazotz.test.ts` comprueba ventanas, daño, encendido de antorchas con proyectiles reales, brasero, luces, pilares y ecos. `store/world7Progress.test.ts` cubre guardados anteriores y desbloqueos. Todos los niveles participan en las pruebas generales de coherencia.

`python imagenes/verify_world7.py` revisa motor, renderer, HUD, boleto y final en Chromium. Usa contacto protegido y entradas de movimiento/salto/fuego automatizadas; el boleto se revisa desde una plataforma alta preparada. No mide dificultad humana. [Capturas e informe](../../../../imagenes/verificacion/mundo7/REVISION.md).

`difficulty.test.ts` comprueba combos, destinos fijos, avisos inofensivos, huecos, luces elevadas y límites exactos del rayo. `python imagenes/verify_camazotz_combat.py` captura los ataques nuevos, completa las tres fases y revisa el desenlace en escritorio y móvil, con contacto protegido y sin quitar PV por script. Informe en `imagenes/verificacion/camazotz-v2/`.
