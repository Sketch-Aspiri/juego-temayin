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

Doce PV, cuatro por fase. Solo recibe daño al estar expuesto: un pisotón descendente o dos impactos de fuego en la misma apertura. Cada ventana permite perder un solo PV. Los avisos duran 0,9 s y las aperturas 3,4 s. Los controles siguen siendo los habituales del juego.

1. **Señor de la Noche.** Alterna picada avisada, enjambre en tres alturas y ráfaga de alas. La picada fija su destino antes de lanzarse; al aterrizar queda expuesto.
2. **Cámara de Xibalbá, a ocho PV.** El suelo de la arena ficticia baja un bloque. Enciende las cuatro antorchas con fuego para abrir la ventana mientras esquivas fragmentos luminosos. Al pasar a esta fase recibes fuego; si lo pierdes por daño, acércate al brasero de la izquierda para recuperarlo. Las antorchas se apagan después de cada ventana. La entrada y la salida siguen selladas durante el descenso.
3. **El Eclipse, a cuatro PV.** Regresa el suelo superior. Recoge tres luces y resiste dos ecos para cargar el Sol de Jade. El rayo horizontal se anuncia y termina físicamente en el primer pilar sólido: salta o busca su lado protegido. Los ecos recorren Púas, Kaimán, Huay Chivo, Huay Pek, Sargazo y Lorencillo; los seis aparecen antes de que termine un combate completado.

Las transiciones protegen temporalmente al jugador. Al derrotarlo se retiran los peligros y la oscuridad, aparece el premio, abre el muro y amanece hasta la bandera. La victoria activa cuatro escenas: liberación, abrazo, regreso por Centenario a Escárcega y agradecimiento final. Se pueden omitir o volver a ver desde Historia sin duplicar la finalización.

## Arte y lugares

Se reutilizan las nueve poses históricas de Camazotz, enemigos, jaula, Temayina y fondos compatibles. Se generaron los recursos que faltaban: seis efectos en un atlas, el brasero, el abrazo y dos paisajes. [Originales, recursos y prompts](../../../../imagenes/nuevos/mundo7/PROMPTS.md).

Xpujil toma como referencia el edificio de tres torres y el estilo Río Bec descritos por el [INAH](https://lugares.inah.gob.mx/es/node/4364). La selva y su fauna se apoyan en la [Reserva de Calakmul, CONANP](https://conanp.gob.mx/conanp/dominios/calakmul/biodiversidad.php), y el entorno de Conhuas en el [estudio de Balam Kú](https://www.conanp.gob.mx/pdf/separata/EPJ-RB-BalamKu.pdf). El trono, la cámara y su descenso son fantasía; el juego no representa la destrucción de un monumento real. El mapa distingue estación de Calakmul, localidad de Conhuas y ubicación ficticia del trono.

## Verificación

`World7.test.ts` recorre inicio y checkpoint de los niveles, el camino del boleto y las tres fases hasta la bandera. `bosses/camazotz/camazotz.test.ts` comprueba ventanas, daño, encendido de antorchas con proyectiles reales, brasero, luces, pilares y ecos. `store/world7Progress.test.ts` cubre guardados anteriores y desbloqueos. Todos los niveles participan en las pruebas generales de coherencia.

`python imagenes/verify_world7.py` revisa motor, renderer, HUD, boleto y final en Chromium. Usa contacto protegido y entradas de movimiento/salto/fuego automatizadas; el boleto se revisa desde una plataforma alta preparada. No mide dificultad humana. [Capturas e informe](../../../../imagenes/verificacion/mundo7/REVISION.md).
