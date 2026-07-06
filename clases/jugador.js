class Jugador extends PIXI.Container {
    constructor(spritesheet, juego) {
        super();
        this.spritesheet = spritesheet;
        this.juego = juego;

        // variables del pj
        this.puedeDisparar = true;
        this.invulnerable = false;
        this.estaCaminando = false;
        this.estaAtacando = false;
        this.estaRecibiendoDanio = false;
        
        this.inventario = [];

        // stats
        this.stats = {
            velocidad: 3.5,
            vidaMax: 100,
            vidaActual: 100,
            danio: 1,
            cantidadBalas: 3,
            dispersion: 0.09,
            cooldown: 800,
            
            // Stats del Aura de Ajo
            radioAjo: 80,
            danioAjo: 0.02,
            cooldownAjo: 700
        };

        ////////////////////////////// Barra de vida/////////////////////////
        this.interfazVida = new PIXI.Container();
        this.interfazVida.visible = false; 

        const fondoBarra = new PIXI.Graphics()
            .rect(-25, -50, 50, 6)
            .fill(0x000000);

        this.barraRoja = new PIXI.Graphics();
        
        this.textoVidaNum = new PIXI.Text({
            text: '', 
            style: {
                fontFamily: 'Arial',
                fontSize: 9, 
                fill: 0xffffff, 
                fontWeight: 'bold',
                dropShadow: {
                    alpha: 0.9,
                    blur: 1,
                    color: '#000000', 
                    distance: 1,
                }
            }
        });
        
        this.textoVidaNum.anchor.set(0.5, 0.5);
        this.textoVidaNum.x = 0;
        this.textoVidaNum.y = -47;

        this.interfazVida.addChild(fondoBarra, this.barraRoja, this.textoVidaNum);
        this.addChild(this.interfazVida);
        //////////////////////////////////////////

        /////////////////////Barra del cooldown////////////////////
        this.barraCooldown = new PIXI.Graphics();
        this.interfazVida.addChild(this.barraCooldown); // Esta en el mismo container que la barra de vida asi se unifican

        // Variables de temporizador
        this.tiempoUltimoDisparo = 0;
        this.enCooldown = false;

        this.actualizarBarraCooldown = () => {
            this.barraCooldown.clear();

            // Si no esta en cooldown no dibuja nada
            if (!this.enCooldown) return;

            const tiempoPasado = Date.now() - this.tiempoUltimoDisparo;
            // Carga de la barrita, cuando esta en 0 quiere decir que recien empieza y cuando llega a 1 es que ya disparo
            const progreso = Math.min(1, tiempoPasado / this.stats.cooldown);

            if (progreso < 1) {
                // Fondo de la barra de cooldown
                this.barraCooldown.rect(-25, -42, 50, 3).fill(0x333333);
                // Barra celeste
                this.barraCooldown.rect(-25, -42, 50 * progreso, 3).fill(0x00d2ff);
                
            } else {
                this.enCooldown = false;
            }
        };
////////////// lo mismo que el cooldown pero con la vida//////////////////////////
        this.actualizarBarra = () => {
            const porcentaje = Math.max(0, this.stats.vidaActual / this.stats.vidaMax);
            this.barraRoja.clear();
            if (porcentaje > 0) {
                this.barraRoja.rect(-25, -50, 50 * porcentaje, 6).fill(0xff0000);
            }

            if (this.textoVidaNum) {
                const vidaMostrar = Math.max(0, Math.floor(this.stats.vidaActual));

                const vidaMaxima = Math.floor(this.stats.vidaMax); // saca los decimales
                this.textoVidaNum.text = `${vidaMostrar}/${vidaMaxima}`;
            }
        };
        this.actualizarBarra();
        ///////////////////////////////////////////////////////////

        //////////// Aura del ajo //////////////////////////////////////
        this.timerAjo = 0;
        this.tieneAjo = false;

        if (this.juego.texturasAjo && this.juego.texturasAjo.length > 0) {
            this.auraAjo = new PIXI.AnimatedSprite(this.juego.texturasAjo);
            this.auraAjo.anchor.set(0.5);
            this.auraAjo.animationSpeed = 0.15;
            this.auraAjo.play();
            this.auraAjo.visible = false;
            this.addChildAt(this.auraAjo, 0); 
        }
        this.actualizarAuraAjo();

        const tex = this.spritesheet.textures;

        // Array de todas las texturas
        const todasLasKeys = Object.keys(tex);

        this.texturasIdle = todasLasKeys
            .filter(key => key.startsWith("IDLE/"))
            .sort()
            .map(key => tex[key]);

        this.texturasWalk = todasLasKeys
            .filter(key => key.startsWith("CORRIENDO/"))
            .sort()
            .map(key => tex[key]);

        this.texturasAtaque = todasLasKeys
            .filter(key => key.startsWith("DISPARO2/"))
            .sort()
            .map(key => tex[key]);

        this.texturasDanio = todasLasKeys
            .filter(key => key.startsWith("PNG/"))
            .sort()
            .map(key => tex[key]);

        // Sprite animado principal
        this.anim = new PIXI.AnimatedSprite(this.texturasIdle);
        this.anim.anchor.set(0.5);
        this.anim.animationSpeed = 0.1;
        this.anim.play();
        this.addChild(this.anim);

        // Control de animaciones para que no se quede en una, si dispara que vuelva al idle y asi
        this.anim.onComplete = () => {
            if (this.estaAtacando || this.estaRecibiendoDanio) {
                this.estaAtacando = false;
                this.estaRecibiendoDanio = false; 
                this.anim.loop = true;

                if (this.estaCaminando) {
                    this.cambiarAnimacion(this.texturasWalk);
                    this.anim.animationSpeed = 0.2;
                } else {
                    this.cambiarAnimacion(this.texturasIdle);
                    this.anim.animationSpeed = 0.08;
                }
            }
        };
    }

    atacar() {
        if (this.estaAtacando || this.estaRecibiendoDanio) return; // aca le puse para que compruebe si puede disparar, por la cadencia

        if (!this.texturasAtaque || this.texturasAtaque.length === 0 || !this.texturasAtaque[0]) {
            console.error("textura de ataque no se cargo");
            return;
        }

        this.estaAtacando = true;
        this.anim.loop = false;
        this.anim.textures = this.texturasAtaque;
        this.anim.animationSpeed = 0.25; 
        this.anim.gotoAndPlay(0);
    }

    reproducirDanio() {
        this.estaAtacando = false; // Corta el ataque si le pegan
        this.estaRecibiendoDanio = true;
        this.anim.loop = false;
        this.anim.textures = this.texturasDanio;
        this.anim.animationSpeed = 0.2; 
        this.anim.gotoAndPlay(0);
    }

    mover(dirX, dirY) {
        this.x += dirX * this.stats.velocidad;
        this.y += dirY * this.stats.velocidad;

        if (dirX !== 0) this.anim.scale.x = dirX > 0 ? 1 : -1;

        // Si le pegan no se queda quieto se mueve, queda feo pero sino es imposible
        if (this.estaAtacando || this.estaRecibiendoDanio) {
            if (dirX !== 0 || dirY !== 0) this.estaCaminando = true;
            return;
        }

        if (!this.estaCaminando) {
            this.estaCaminando = true;
            this.cambiarAnimacion(this.texturasWalk);
            this.anim.animationSpeed = 0.2;
        }
    }

    detener() {
        this.estaCaminando = false;

        if (this.estaAtacando || this.estaRecibiendoDanio) return;

        this.cambiarAnimacion(this.texturasIdle);
        this.anim.animationSpeed = 0.08;
    }

    cambiarAnimacion(nuevasTexturas) {
        if (nuevasTexturas.length > 0 && this.anim.textures !== nuevasTexturas) {
            this.anim.textures = nuevasTexturas;
            this.anim.play();
        }
    }

    disparar() {
            //si no puede disparar te da false
        if (!this.puedeDisparar) return false;
        
        this.puedeDisparar = false;
        this.tiempoUltimoDisparo = Date.now();
        this.enCooldown = true;

        // Activa la animación visual de ataque
        this.atacar();

        const mirandoDerecha = this.anim.scale.x > 0;
        const anguloBase = mirandoDerecha ? 0 : Math.PI;
        const cantidad = this.stats.cantidadBalas;
        const separacion = this.stats.dispersion;

        for (let i = 0; i < cantidad; i++) {
            const offset = (i - (cantidad - 1) / 2) * separacion;
            const angulo = anguloBase + offset;

            const dirX = Math.cos(angulo);
            const dirY = Math.sin(angulo);

            const bala = new Bala(
                this.x + (mirandoDerecha ? 30 : -30),
                this.y,
                dirX,
                dirY,
                angulo,
                this.stats.danio,
                this.juego.texturasBalas
            );

            this.juego.mundo.addChild(bala);
            this.juego.balas.push(bala);
        }

        // Comprueba si ya puede disparar, o sea si se acabo el cooldown
        setTimeout(() => {
            this.puedeDisparar = true;
            this.enCooldown = false; 
        }, this.stats.cooldown);
        return true;
    }

    // Cuando agarra un item se fija si lo tenia y si duplica sus stats
    agregarItem(item) {
        const existente = this.inventario.find(i => i.nombre === item.nombre);
        if (existente) {
            existente.aplicar(this);
        } else {
            item.aplicar(this);
            this.inventario.push(item);
        }
    }

    resetear() {
        this.puedeDisparar = true;
        this.invulnerable = false;
        this.estaCaminando = false;
        this.estaAtacando = false;
        this.estaRecibiendoDanio = false;
        this.enCooldown = false;

        // Aca resetea las stats PORFIN
        this.stats.vidaMax = 100; 
        this.stats.vidaActual = this.stats.vidaMax;
        this.stats.velocidad = 3.5;
        this.stats.danio = 1;
        this.stats.cantidadBalas = 3;
        this.stats.dispersion = 0.09;
        this.stats.cooldown = 800;

        /////// le pone false al ajo porque no se le quitaba la aureola del efecto y detectaba que lo tenia /////////
        this.tieneAjo = false;
        this.inventario = []; 
        this.stats.danioAjo = 0; 
        this.stats.radioAjo = 0;
        this.actualizarAuraAjo();
        if (this.auraAjo) {
            this.auraAjo.visible = false;
        }
        //////////////////////////////////////
        this.actualizarBarra();
        if (this.barraCooldown) this.barraCooldown.clear();
        this.anim.loop = true;
        this.cambiarAnimacion(this.texturasIdle);
        this.anim.animationSpeed = 0.1;
        this.anim.gotoAndPlay(0);
    }

    // La visual del ajo
    actualizarAuraAjo() {
        if (!this.auraAjo) return;

        if (!this.tieneAjo) {
            this.auraAjo.visible = false;
            if (typeof this.auraAjo.clear === 'function') this.auraAjo.clear(); 
            return;
        }

        this.auraAjo.visible = true;

        const escala = this.stats.radioAjo / 60;
        this.auraAjo.scale.set(escala);
    }


    update(delta) {
        this.actualizarBarraCooldown();
    }
    
}