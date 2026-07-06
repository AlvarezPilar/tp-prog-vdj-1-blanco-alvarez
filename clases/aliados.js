class Aliado extends PIXI.Container {
    constructor(juego, radioOrbita = 60, velocidadGiro = 0.03) {
        super();
        this.juego = juego;
        this.jugador = juego.jugador;

        // movimietno de la órbita
        this.anguloOrbita = Math.random() * Math.PI * 2; // arranca en un angulo aleatorio
        this.radioOrbita = radioOrbita;
        this.velocidadGiro = velocidadGiro;
        this.juego.mundo.addChild(this);
    }

    actualizarOrbita(delta) {
        if (!this.jugador || this.jugador.muerto) return;

        //el aliado orbita alrededor del jugador
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
                this.sprite.animationSpeed = 0.20; 
                this.sprite.scale.set(2);          
                this.sprite.play();
                this.addChild(this.sprite);
                console.log("¡Sprite de la paloma cargado perfectamente!");
            } else {
                console.error("ERROR: El spritesheet no contiene texturas válidas.");
            }
        } else {
            console.error("ERROR: No se recibió un spritesheet válido en la Paloma.");
        }

        // propiedades del disparo de la paloma
        this.cooldownDisparo = 1500; 
        this.timerDisparo = 0;
        this.rangoAtaque = 350;
    }

    update(delta) {
        this.actualizarOrbita(delta);

        // el sprite gira segun a que lado mire
        if (this.sprite) {
            const velocidadX = Math.cos(this.anguloOrbita);
            if (velocidadX < 0) {
                this.sprite.scale.x = -Math.abs(this.sprite.scale.y); 
            } else {
                this.sprite.scale.x = Math.abs(this.sprite.scale.y);  
            }
        }

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
        // fija un angulo segun la ubicacion del enemigo
        const dx = enemigo.x - this.x;
        const dy = enemigo.y - this.y;
        const angulo = Math.atan2(dy, dx);

        // juntamos datos sobre la bala
        const dirX = Math.cos(angulo);
        const dirY = Math.sin(angulo);

        const danioPaloma = 1; 

        if (typeof Bala === 'function') {        // usamos el constructor para crear instancia de Bala
            const nuevaBala = new Bala(
                this.x, 
                this.y, 
                dirX, 
                dirY, 
                angulo, 
                danioPaloma, 
                this.juego.texturasBalas
            ); 

            this.juego.mundo.addChild(nuevaBala);
            this.juego.balas.push(nuevaBala);
        }

        
        if (this.juego.sonidos) {
            this.juego.sonidos.reproducir('disparo');// sonido del disparo
        }
    }
}