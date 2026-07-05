// Aliados.js

// --- CLASE BASE PARA CUALQUIER COMPAÑERO ---
class Aliado extends PIXI.Container {
    constructor(juego, radioOrbita = 60, velocidadGiro = 0.03) {
        super();
        this.juego = juego;
        this.jugador = juego.jugador;

        // Propiedades de movimiento (órbita)
        this.anguloOrbita = Math.random() * Math.PI * 2; // Ángulo inicial aleatorio
        this.radioOrbita = radioOrbita;
        this.velocidadGiro = velocidadGiro;

        // Añadir automáticamente al contenedor del mapa
        this.juego.mundo.addChild(this);
    }

    actualizarOrbita(delta) {
        if (!this.jugador || this.jugador.muerto) return;

        // Hace que gire en círculos alrededor del jugador
        this.anguloOrbita += this.velocidadGiro * delta;
        this.x = this.jugador.x + Math.cos(this.anguloOrbita) * this.radioOrbita;
        this.y = this.jugador.y + Math.sin(this.anguloOrbita) * this.radioOrbita;
    }

    buscarEnemigoMasCercano(rangoAtaque) {
        let enemigoMasCercano = null;
        let distanciaMinima = rangoAtaque;
        const enemigosVivos = this.juego.enemigos.filter(en => !en.muerto);

        enemigosVivos.forEach(enemigo => {
            const dx = enemigo.x - this.x;
            const dy = enemigo.y - this.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < distanciaMinima) {
                distanciaMinima = distancia;
                enemigoMasCercano = enemigo;
            }
        });

        return enemigoMasCercano;
    }
}

class PalomaAliada extends Aliado {
    constructor(juego, spritesheet) {
        super(juego, 65, 0.025);
    
        if (spritesheet && spritesheet.textures) {
            const claves = Object.keys(spritesheet.textures);
            const texturasAnimacion = claves.map(clave => spritesheet.textures[clave]);

            if (texturasAnimacion.length > 0) {
                this.sprite = new PIXI.AnimatedSprite(texturasAnimacion);
                this.sprite.anchor.set(0.5);
                this.sprite.animationSpeed = 0.20; // Velocidad del aleteo
                this.sprite.scale.set(2);          // Escalado del sprite (ajustalo si queda muy grande/chico)
                this.sprite.play();
                this.addChild(this.sprite);
                console.log("¡Sprite de la paloma cargado perfectamente!");
            } else {
                console.error("ERROR: El spritesheet no contiene texturas válidas.");
            }
        } else {
            console.error("ERROR: No se recibió un spritesheet válido en la Paloma.");
        }

        // Balance de combate
        this.cooldownDisparo = 1500; 
        this.timerDisparo = 0;
        this.rangoAtaque = 350;
    }

    update(delta) {
        // 1. Moverse en órbita usando la función de la clase padre
        this.actualizarOrbita(delta);

        // 🔄 Rotación del sprite (Voltear según la dirección del giro)
        if (this.sprite) {
            const velocidadX = Math.cos(this.anguloOrbita);
            if (velocidadX < 0) {
                this.sprite.scale.x = -Math.abs(this.sprite.scale.y); // Mira a la izquierda
            } else {
                this.sprite.scale.x = Math.abs(this.sprite.scale.y);  // Mira a la derecha
            }
        }

        // 2. Lógica de ataque
        this.timerDisparo += this.juego.pixiApp.ticker.elapsedMS;

        if (this.timerDisparo >= this.cooldownDisparo) {
            const objetivo = this.buscarEnemigoMasCercano(this.rangoAtaque);
            
            if (objetivo) {
                this.atacar(objetivo);
                this.timerDisparo = 0;
            }
        }
    }

    atacar(enemigo) {
        // 1. Calculamos el ángulo exacto hacia el enemigo
        const dx = enemigo.x - this.x;
        const dy = enemigo.y - this.y;
        const angulo = Math.atan2(dy, dx);

        // 2. Definimos los componentes de dirección requeridos por tu constructor de Bala
        const dirX = Math.cos(angulo);
        const dirY = Math.sin(angulo);

        // 3. Daño de la paloma
        const danioPaloma = 1; 

        // 4. Instanciamos la bala respetando el orden exacto de tu constructor
        if (typeof Bala === 'function') {
            const nuevaBala = new Bala(
                this.x, 
                this.y, 
                dirX, 
                dirY, 
                angulo, 
                danioPaloma, 
                this.juego.texturasBalas
            ); 

            // 5. La agregamos al contenedor del mapa y al array global del bucle de colisiones
            this.juego.mundo.addChild(nuevaBala);
            this.juego.balas.push(nuevaBala);
        }

        // Fx de audio
        if (this.juego.sonidos) {
            this.juego.sonidos.reproducir('disparo');
        }
    }
}