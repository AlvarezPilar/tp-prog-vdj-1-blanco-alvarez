
# 🎮 ETERNAL HUNT

Este proyecto forma parte de la cursada de Programación de Videojuegos 1 en la Universidad Nacional de Hurlingham (UNAHUR).

---

## 🚀 DESCRIPCION DEL JUEGO

Nuestro proyecto consiste en un juego incremental inspirado por Vampire Survivors en el cual nuestro personaje jugable debe sobrevivir oleadas de enemigos siendo recompensado por sus esfuerzos, mientras los desafíos suben en intensidad.

El personaje jugable tiene sus propias cualidades y habilidades, las cuales puede mejorar y modificar a través de la obtención de ítems. El primero es elegido por el jugador para acercarlo al concepto de estas mejoras, y guiado por una flecha deberá buscarlo en el mapa, de la misma forma que deberá conseguir los demás ítems eliminando enemigos de mayor fuerza que aparecerán entre las oleadas de enemigos comunes.

El loop del juego se sostiene a partir de la habilidad del jugador al no dejarse sucumbir por la cantidad de enemigos y matar aquellos que le sean un impedimento fundamental a su progreso (como despejar su camino hacia una mejora) o matar estratégicamente a aquellos que le puedan dar algún beneficio. El entendimiento de esto es lo que lleva al jugador a poder mejorar sus estadísticas para equiparar sus posibilidades de sostener una partida más larga.
---

## 🛠️ Tecnologías Utilizadas

* **Lenguaje:** JavaScript (ES6+)
* **Motor Gráfico:** PIXI.js
* **Estructura:** Programación Orientada a Objetos (POO)
* **Entorno:** HTML5 / WebGL

---

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
