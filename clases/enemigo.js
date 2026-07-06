class Enemigo extends PIXI.Container {
    constructor(x, y, spritesheet, tipo = 'fantasma') {
        super();
        this.x = x;
        this.y = y;
        this.spritesheet = spritesheet;
        this.tipo = tipo;
        this.estado = 'apareciendo';

        // Stats de enemigos
        const statsBase = {
            'fantasma': { escala: 1.5, animSpeed: 0.2, vida: 3, xp: 10, velocidad: 2, invertirX: true },
            'esqueleto': { escala: 0.5, animSpeed: 0.12, vida: 5, xp: 20, velocidad: 2, invertirX: false },
            'lobo': { escala: 2, animSpeed: 0.2, vida: 4, xp: 30, velocidad: 3, invertirX: true },  
            'murcielago': { escala: 0.5, animSpeed: 0.22, vida: 2, xp: 12, velocidad: 2.6, invertirX: false },
            'caballo_maldito': { escala: 2.2, animSpeed: 0.12, vida: 100, xp: 1200, velocidad: 3, invertirX: true }
        };

        const config = statsBase[this.tipo] || statsBase['fantasma'];

        // propiedades que usan los enemigops
        this.esJefe = false; 
        this.xpOtorga = config.xp;
        this.escalaBase = config.escala;
        this.vidaActual = config.vida;
        this.velocidad = config.velocidad;
        this.invertirX = config.invertirX;  
        this.animSpeedBase = config.animSpeed;

        // filtros de texturas por nombres
        const keys = Object.keys(this.spritesheet.textures);

        this.texturasMuerte = keys
            .filter(k => k.toLowerCase().includes("vanish") || 
                         k.toLowerCase().includes("muerte"))
            .map(k => spritesheet.textures[k]);

        this.texturasChase = keys
            .filter(k => k.toLowerCase().includes("chase") || 
                         k.toLowerCase().includes("walk") || 
                         k.toLowerCase().includes("run") || 
                         k.toLowerCase().includes("caminando") || 
                         k.toLowerCase().includes("volando")) 
            .map(k => spritesheet.textures[k]);

        this.texturasIdle = keys
            .filter(k => k.toLowerCase().includes("idle") || 
                         k.toLowerCase().includes("mirando"))
            .map(k => spritesheet.textures[k]);

        this.texturasAparecer = keys
            .filter(k => k.toLowerCase().includes("spawn") || 
                         k.toLowerCase().includes("appear") || 
                         k.toLowerCase().includes("aparecer"))
            .map(k => spritesheet.textures[k]);

        // respaldo por si un enemigo no tiene frame de idle agarra el frame 0 para que no rompa
        if (this.texturasIdle.length === 0) {
            this.texturasIdle = this.texturasChase.length > 0 ? this.texturasChase : [spritesheet.textures[keys[0]]];
        }

        // Config de los sprites
        this.sprite = new PIXI.AnimatedSprite(this.texturasIdle);
        this.sprite.anchor.set(0.5);
        this.sprite.animationSpeed = config.animSpeed;
        this.sprite.scale.set(this.escalaBase);
        this.sprite.play();
        // aca lo añadimos al stage
        this.addChild(this.sprite);

        this.muerto = false;
        this.apareciendo = true;

        ////////// Logica del spawn de enemigos///////////////////////////
        if (this.texturasAparecer.length > 0) {
            // Animación por texturas
            this.sprite.textures = this.texturasAparecer;
            this.sprite.loop = false; 
            this.sprite.gotoAndPlay(0);
            this.sprite.onComplete = () => {
                this.apareciendo = false;
                this.sprite.loop = true;
                this.cambiarAnimacion(this.texturasIdle);
                this.estado = 'idle';
            };
        } else {
            // efecto fade in por si no tienen animacion de aparicion (esqueleto no tiene y creo que el caballo y el lobo tampoco)
            this.sprite.alpha = 0; 
            this.sprite.scale.set(0);
            //comprueba si el enemigo se murio y se borro asi no se sobreescribe ni tira ERRORES
            let pasos = 0;
            let inte = setInterval(() => {
                if (!this.sprite || !this.sprite.parent) { 
                    clearInterval(inte);
                    return;
                }
                
                pasos++;
                this.sprite.alpha += 0.1;
                
                // Escala progresivamente
                const incremento = this.escalaBase / 10;
                this.sprite.scale.x += (this.sprite.scale.x < 0 ? -1 : 1) * incremento;
                this.sprite.scale.y += incremento;
                
                // Termina c uando llega a 10
                if (pasos >= 10 || this.sprite.alpha >= 1) {
                    this.sprite.alpha = 1;
                    this.sprite.scale.set(this.escalaBase);
                    this.apareciendo = false; // Aca ya permite el movimiento del enemigo
                    this.estado = 'idle';
                    this.cambiarAnimacion(this.texturasChase); // Aca fijate q fuerza la animación de chase o sea ya pueden empezar a buscarte/correr
                    clearInterval(inte);
                }
            }, 50);
        }
    }
    ///////////////////////////////////////////////////


    /////////Logico del movimiento para los enemigos///////////////////////////
    actualizar(jugadorX, jugadorY, delta, otrosEnemigos) {
    if (this.muerto) return;

    switch (this.estado) {
        case 'apareciendo':
            // Tu lógica de spawn (fade in o animacion) ya maneja esto, 
            // solo asegúrate de que cuando termine, cambies a 'idle' o 'chase'
            break;
        case 'idle':
            this.logicaIdle(jugadorX, jugadorY, delta);
            break;
        case 'chase':
            this.logicaChase(jugadorX, jugadorY, delta, otrosEnemigos);
            break;
        case 'atacar':
            this.logicaAtacar(jugadorX, jugadorY, delta);
            break;
    }
}
logicaIdle(jugadorX, jugadorY, delta) {
    this.cambiarAnimacion(this.texturasIdle);
    // ¿El jugador se acercó? Cambiar a chase
    const dist = this.distanciaAlJugador(jugadorX, jugadorY);
    if (dist < 500) this.estado = 'chase';
}

logicaChase(jugadorX, jugadorY, delta, otrosEnemigos) {
    this.cambiarAnimacion(this.texturasChase);
    
    // Moverse hacia el jugador (aquí pones tu lógica actual de movimiento)
    this.moverseHaciaJugador(jugadorX, jugadorY, delta, otrosEnemigos);

    // ¿Muy cerca? Atacar
    if (this.distanciaAlJugador(jugadorX, jugadorY) < 30) {
        this.estado = 'atacar';
    }
}

logicaAtacar(jugadorX, jugadorY, delta) {
    // Lógica de ataque (por ejemplo, esperar un cooldown)
    // Cuando el jugador se aleje, volver a perseguir
    if (this.distanciaAlJugador(jugadorX, jugadorY) > 50) {
        this.estado = 'chase';
    }
}
moverseHaciaJugador(jugadorX, jugadorY, delta, otrosEnemigos) {
    let dx = jugadorX - this.x;
    let dy = jugadorY - this.y;
    let distancia = Math.sqrt(dx * dx + dy * dy);

    let dirX = dx / (distancia || 1);
    let dirY = dy / (distancia || 1);
    
    // Lógica de separación (para que no se amontonen)
    let separacionX = 0, separacionY = 0;
    let radioSeparacion = 55;
    otrosEnemigos.forEach(otro => {
        if (otro === this || otro.muerto || otro.apareciendo) return;
        let dist = Math.sqrt((this.x - otro.x)**2 + (this.y - otro.y)**2);
        if (dist < radioSeparacion) {
            let fuerza = (radioSeparacion - dist) / radioSeparacion;
            separacionX += (this.x - otro.x) * fuerza;
            separacionY += (this.y - otro.y) * fuerza;
        }
    });

    // Aplicar movimiento
    let movX = (dirX * 0.7) + (separacionX * 2.5) + (Math.random() - 0.5) * 0.05;
    let movY = (dirY * 0.7) + (separacionY * 2.5) + (Math.random() - 0.5) * 0.05;
    let mag = Math.sqrt(movX * movX + movY * movY);
    
    this.x += (movX / (mag || 1)) * this.velocidad * delta;
    this.y += (movY / (mag || 1)) * this.velocidad * delta;

    // Voltear sprite
    if (dx !== 0) {
        const mirandoDerecha = dx > 0;
        this.sprite.scale.x = (this.invertirX ? (mirandoDerecha ? -1 : 1) : (mirandoDerecha ? 1 : -1)) * this.escalaBase;
    }
}

// Método auxiliar para no repetir el Math.sqrt
distanciaAlJugador(jx, jy) {
    return Math.sqrt((jx - this.x)**2 + (jy - this.y)**2);
}

    cambiarAnimacion(nuevasTexturas) {
    if (!nuevasTexturas || nuevasTexturas.length === 0 || this.sprite.textures === nuevasTexturas) {
        return;
    }

    this.sprite.textures = nuevasTexturas;
    
    // Aca forcé a que el enemigo use la velocidad de las stats. Mas por un error que tenia que por otra cosa
    this.sprite.animationSpeed = this.animSpeedBase || 0.1;
    
    this.sprite.play();
}   

    recibirDanio(cantidad) {
        if (this.muerto || this.apareciendo) return;
        
        this.vidaActual -= cantidad; 
        
        this.sprite.tint = 0xff0000;
        setTimeout(() => { if (this.sprite) this.sprite.tint = 0xffffff; }, 100);
        
        if (this.vidaActual <= 0) this.morir();
    }

    morir() {
        if (this.muerto) return;
        this.muerto = true;
        this.velocidad = 0;
        
        this.sprite.onComplete = null; 
        this.sprite.loop = false;
        
        // Logica para que el jefe dropee un item aleatorio
        if (this.esJefe) {
            if (window.juego && typeof window.juego.dropearItemAleatorio === "function") {
                window.juego.dropearItemAleatorio();
            }
        }

        // Te da xp
        if (window.juego) window.juego.ganarXP(this.xpOtorga); 
        
        if (this.texturasMuerte.length > 0) {
            this.sprite.textures = this.texturasMuerte;
            this.sprite.animationSpeed = 0.15;
            this.sprite.gotoAndPlay(0);
            this.sprite.onComplete = () => this.eliminar();
        } else {
            this.eliminar();
        }
    }

    eliminar() {
        if (this.parent) this.parent.removeChild(this);
        this.destroy({ children: true }); // DESTRUYE al enemigo. AJAJSDJASD por la ram
    }
}