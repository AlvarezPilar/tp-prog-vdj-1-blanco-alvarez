
![LogoUnahur](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/daccffb03982008d71da2000cee91391a1de04c7/FOTOSREADME/logounahur.png)

![LogoProyecto](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/daccffb03982008d71da2000cee91391a1de04c7/image-removebg-preview.png)



Este proyecto forma parte de la cursada de Programación de Videojuegos 1 en la Universidad Nacional de Hurlingham (UNAHUR).


## INTEGRANTES

- Alvarez Pilar (AlvarezPilar)
- Julian Gabriel Blanco (JulianGabrielBlanco)




## DESCRIPCION DEL JUEGO

Nuestro proyecto consiste en un juego incremental inspirado por Vampire Survivors en el cual nuestro personaje jugable debe sobrevivir oleadas de enemigos siendo recompensado por sus esfuerzos, mientras los desafíos suben en intensidad.

El personaje jugable tiene sus propias cualidades y habilidades, las cuales puede mejorar y modificar a través de la obtención de ítems. El primero es elegido por el jugador para acercarlo al concepto de estas mejoras, y guiado por una flecha deberá buscarlo en el mapa, de la misma forma que deberá conseguir los demás ítems eliminando enemigos de mayor fuerza que aparecerán entre las oleadas de enemigos comunes.

El loop del juego se sostiene a partir de la habilidad del jugador al no dejarse sucumbir por la cantidad de enemigos y matar aquellos que le sean un impedimento fundamental a su progreso (como despejar su camino hacia una mejora) o matar estratégicamente a aquellos que le puedan dar algún beneficio. El entendimiento de esto es lo que lleva al jugador a poder mejorar sus estadísticas para equiparar sus posibilidades de sostener una partida más larga.

## CONTROLES 

![CONTROLES](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/d4f95ff093f688ee6dbd3f7ee2d203dd783af290/menuInstrucciones.png)

## NOVEDADES

Algunas de las novedades que incorporamos en esta nueva instancia de nuestro proyecto incluyen:

    - Nuevas funciones: botón para silenciar la música sin afectar efectos de sonido
    - Controles: disparar con click izquierdo además de la tecla espacio
    - Comportamientos: máquina de estados para enemigos
    - Decoraciones: pantalla de inicio, pantalla de carga, assets, marcos, descripciones simultaneas al item sobre el cual se posiciona el mouse
    - Sistema de items: aparicion de cofres con ítems aleatorios
    - Nuevo item aliado: una paloma que dispara al enemigo más cercano


### Veamos alguno de estos cambios

![MENU PAUSA](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/6b7f638194a20ae5f8fee434d5aca155c78e81fd/menupausa2.png)

En esta foto se puede observar la UI del menú de pausa, donde se encuentran las estadisticas acutales del jugador, los items que posee, la opcion de pausar, reiniciar o salir del juego, y el poder silenciar la música.

![COFRE PALOMA](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/6b7f638194a20ae5f8fee434d5aca155c78e81fd/FOTOSREADME/aparececofre.png)

En esta captura vemos las nuevas adiciones en acción; la aparición de cofres cada 5 niveles de experiencia, y el nuevo item que consiste en un aliado que dispara a su propio ritmo mientras orbita a nuestro alrededor.

![MENUCOFRE](https://github.com/AlvarezPilar/tp-prog-vdj-1-blanco-alvarez/blob/6b7f638194a20ae5f8fee434d5aca155c78e81fd/FOTOSREADME/menucofre.png)

Al terminar la animación de apertura del cofre, vemos ésta interfaz en la que se nos presenta a elegir uno entre tres items aleatorios.



## 🛠️ Tecnologías Utilizadas

* **Lenguaje:** JavaScript (ES6+)
* **Motor Gráfico:** PIXI.js
* **Entorno:** HTML5 / WebGL

---
## Controles

*  Movimiento: WASD
*  Ataque: SPACE
*  Interfaz y pausa: ESC,P


## 📂 Estructura del Código (Arquitectura POO)

El proyecto está organizado de forma modular, donde los componentes principales heredan las propiedades físicas y visuales de PIXI:

* `Juego.js`: El núcleo principal del videojuego (Game Loop, inicialización de PIXI y control de estados de las pantallas).
* `Jugador.js`: Controla las estadísticas del héroe, animaciones (`AnimatedSprite`), interfaz flotante de vida/cooldown y la lógica de disparos/items.
* `Enemigo.js`: Maneja la máquina de estados de los monstruos (Chase, Idle, Recibir Daño, Muerte) y las físicas de persecución de la IA.
* `Balas.js`: Define el comportamiento, daño, dirección y velocidad de los proyectiles en el mapa.
* `Item.js`: La estructura para la logica de los items.
* `ItemFisico.js`: La estructura visual de los items.
* `Sonido.js`: Logica del sonido.

---
