class Juego {
    constructor() {
        this.sonidos = null;
        this.pixiApp = null;
        this.enMenuPrincipal = true; //arranca el juego en menu principal
        this.juegoPausado = false; 
        this.timerSpawn = 0;
        this.frecuenciaSpawn = 2000;
        this.nivelActual = 1;
        this.xpActual = 0;
        this.xpNecesaria = 100; //requisito para pasar al siguiente nivel
        this.limiteEnemigos = 25;
        this.jefeActivo = false; //indica si hay un jefe vivo 
        this.oleadaCaballoActiva = false; //espera hasta que spawnee Caballo para retener algunos enemigos y spawnear otros
        this.faseActual = 0;
        this.aliados = [];
        this.planDeJefes = [
    { 
        nombre: 'lobo_alfa', 
        tipoBase: 'lobo',    
        tiempo: 180, // 3 minutos // momento a partir del cual spawnea
        faseQueActiva: 1,
        escala: 3.5,         //tamaño del sprite
        vida: 50,            
        danio: 20, 
        xp: 500, 
        aparecido: false 
    },
    { 
        nombre: 'caballo_maldito', 
        tipoBase: 'caballo', 
        tiempo: 300,        // 5 minutos
        escala: 2.2,        
        faseQueActiva: 2,
        vida: 100,         
        danio: 35,          
        xp: 1500,         
        aparecido: false 
    }
];
        
        this.itemObjetivo = null; // item al que lleva la flecha
        this.juegoPausado = false;
        this.contenedorSeleccionInicial = null;
        this.init();
    }

    async init() {
        this.pixiApp = new PIXI.Application();
        const config = { resizeTo: window, backgroundColor: 0x000000 };
        await this.pixiApp.init(config);
        
        //////////////////////TIPOGRAFÍA///////////////////////

        try {
            await document.fonts.load('16px "alagard"');
        } catch (e) {
            console.warn("No se pudo cargar la fuente alagard, usando Arial por defecto.");
        }

        document.body.appendChild(this.pixiApp.canvas);
        window.juego = this; 

        /////////////////////BARRA DE EXPERIENCIA//////////////////////

        this.contenedorXP = new PIXI.Container();
        this.barraXP_Fondo = new PIXI.Graphics()
            .rect(0, 0, window.innerWidth, 15)
            .fill(0x333333);
        this.barraXP_Fondo.alpha = 0.5;
        this.barraXP_Relleno = new PIXI.Graphics();
        this.contenedorXP.addChild(this.barraXP_Fondo, this.barraXP_Relleno);
        this.contenedorXP.visible = false;

        this.textoNivel = new PIXI.Text({
            text: `NIVEL: ${this.nivelActual}`, ///texto que detalla la barra de vida
            style: {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xffffff,
                fontWeight: 'bold',
                dropShadow: {
                    alpha: 0.5,
                    blur: 2,
                    color: '#000000',
                    distance: 2,
                },
            }
        });
        this.textoNivel.anchor.set(0.5, 0);
        this.textoNivel.x = window.innerWidth / 2;
        this.textoNivel.y = 0;
        this.contenedorXP.addChild(this.textoNivel);

        this.actualizarBarraXP = () => {
            const anchoPantalla = window.innerWidth;
            const porcentaje = Math.min(this.xpActual / this.xpNecesaria, 1);
            const anchoRelleno = porcentaje * anchoPantalla;

            this.barraXP_Relleno.clear();
            this.barraXP_Relleno.rect(0, 0, anchoRelleno, 12).fill(0x00CCFF); 
        };

        ///////////////////////////////////INVENTARIO///////////////////////////

        this.slotsInventario = []; 
        this.contenedorInventario = new PIXI.Container();
        this.contenedorInventario.x = 20;  // espacio desde la izquierda
        this.contenedorInventario.y = 35;  // mas abajo de la barra de experiencia
        this.contenedorInventario.visible = false; 

        this.texRanuras = await PIXI.Assets.load('imagenes/fx/slots/slotitems.png');

        ///CIRCULOS
        const anchoSlotImagen = 41;   
        const altoSlotImagen = 41;    
        const espacioSlots = -1;      

        for (let i = 0; i < 8; i++) {
            const slot = new PIXI.Container();
            slot.x = i * (anchoSlotImagen + espacioSlots);
            slot.y = 0;

        
            ///divide la tira de 8 slots que armamos en 8 espacios individuales
            const regionRecorte = new PIXI.Rectangle(i * anchoSlotImagen, 0, anchoSlotImagen, altoSlotImagen);
            const texturaIndividual = new PIXI.Texture({
                source: this.texRanuras.source,
                frame: regionRecorte
            });
            
            // crea un sprite con el círculo
            const fondoSlot = new PIXI.Sprite(texturaIndividual);
            
            slot.addChild(fondoSlot);
            
            slot.ocupado = false;
            slot.icono = null;

            this.contenedorInventario.addChild(slot);
            this.slotsInventario.push(slot); 
        }

        this.mapaAncho = 5000; 
        this.mapaAlto = 2500;
        const nivelZoom = 1.1;

        this.mundo = new PIXI.Container();
        this.mundo.visible = false; 
        this.enemigos = [];
        this.balas = [];
        this.itemsMapa = []; 



        try {
            /////////////////////        CARGA DE TEXTURAS ITEMS      //////////////////////////////

            this.sonidos = new GestorSonidos();
            this.sheetAjo = await PIXI.Assets.load('imagenes/fx/items/ajo/texture.json');//aura animacion del itemAjo "emanar"
            this.texturasAjo = Object.values(this.sheetAjo.textures);
            this.texIconoAjo = await PIXI.Assets.load('imagenes/fx/items/ajo/iconoajo.png');
            this.sheetPaloma = await PIXI.Assets.load('enemigos/PALOMA/texture.json');
            this.texIconoPaloma = await PIXI.Assets.load('enemigos/PALOMA/iconoPaloma.png');

            this.texVeloz = await PIXI.Assets.load('imagenes/fx/items/iconos/veloz.png');
            this.texDanio = await PIXI.Assets.load('imagenes/fx/items/iconos/danio.png');
            this.texDosDisparos = await PIXI.Assets.load('imagenes/fx/items/iconos/masDisp.png');
            this.texCadencia = await PIXI.Assets.load('imagenes/fx/items/iconos/cadencia.png');
            this.texPrecision = await PIXI.Assets.load('imagenes/fx/items/iconos/precis.png');
            this.texVida = await PIXI.Assets.load('imagenes/fx/items/iconos/vida.png');
            this.texVidaMax = await PIXI.Assets.load('imagenes/fx/items/iconos/vidaMax.png');
            

            /////////////////////////       ITEMS       ///////////////////////////////////

            this.dosDisparosMas = new Item("Violencia", (jugador) => { jugador.stats.cantidadBalas += 2; }, this.texDosDisparos);
            this.itemCadencia = new Item("Frenesí", (jugador) => { jugador.stats.cooldown -= 100; }, this.texCadencia);
            this.itemPrecision = new Item("Foco", (jugador) => { jugador.stats.dispersion *= 0.5; }, this.texPrecision); ///achica el cono de los disparos
            
            this.itemVidaMax = new Item("Benevolencia", (jugador) => {
                jugador.stats.vidaMax += 20;
                jugador.stats.vidaActual = jugador.stats.vidaMax;
                jugador.actualizarBarra();
            }, this.texVidaMax); //suma 20 a la vida maxima y rellena toda la barra de vida

            this.itemVida = new Item("Piedad", (jugador) => {
                jugador.stats.vidaActual += 20;
                jugador.stats.vidaActual = Math.min(jugador.stats.vidaActual, jugador.stats.vidaMax);
                jugador.actualizarBarra();
            }, this.texVida);

            this.itemAjo = new Item("Emanar", (jugador) => {
                jugador.tieneAjo = true;
                jugador.stats.danioAjo += 0.3;
                jugador.stats.radioAjo += 5;
                jugador.actualizarAuraAjo();
            }, this.texIconoAjo);

            this.itemPaloma = new Item("Compañero Alado", (jugador) => {
                const nuevaPaloma = new PalomaAliada(this, this.sheetPaloma);
                this.aliados.push(nuevaPaloma);
            }, this.texIconoPaloma);


            this.masDanio = new Item("Vigor", (jugador) => { jugador.stats.danio += 0.5; }, this.texDanio);
            this.masVeloz = new Item("Prisa", (jugador) => { jugador.stats.velocidad += 0.5; }, this.texVeloz);
            this.poolItems = [
                this.itemAjo,
                this.masVeloz,
                this.dosDisparosMas,
                this.itemCadencia,
                this.itemPrecision,
                this.itemVidaMax,
                this.itemVida,
                this.masDanio,
                this.itemPaloma
            ]; //para los drops de los enemigos y la eleccion inicial de item
            
            /////////////////////////////        FONDO          //////////////////////////////////////

            const texturaFondo = await PIXI.Assets.load('imagenes/MAPA.png');
            this.fondo = new PIXI.TilingSprite({ //el fondo se repite
                texture: texturaFondo,
                width: this.pixiApp.screen.width,  
                height: this.pixiApp.screen.height, 
            });
            this.fondo.tileScale.set(0.5, 0.5);
            this.fondo.visible = false; 
            this.pixiApp.stage.addChild(this.fondo); 

            ////////////////////////////       UI - MENU           ///////////////////////////////////

            this.texturaFondoInicio = await PIXI.Assets.load('imagenes/fondo_inicio.png');
            this.texturaMenuPausa = await PIXI.Assets.load('imagenes/ui_menu/menu_pausa.png');
            this.texturaCuadroInstrucciones = await PIXI.Assets.load('imagenes/fondo_inst.png');

            //cada boton tiene una version "apretada" y "sin apretar"
            this.texJugar1 = await PIXI.Assets.load('imagenes/ui_menu/BOTONJUGAR/boton_jugar (1).png');
            this.texJugar2 = await PIXI.Assets.load('imagenes/ui_menu/BOTONJUGAR/boton_jugar (2).png');
            this.texInst1 = await PIXI.Assets.load('imagenes/ui_menu/BOTONINSTRUCCCIONES/boton_inst (1).png');
            this.texInst2 = await PIXI.Assets.load('imagenes/ui_menu/BOTONINSTRUCCCIONES/boton_inst (2).png');
            this.texSalir1 = await PIXI.Assets.load('imagenes/ui_menu/BOTONSALIR/boton_salir (1).png');
            this.texSalir2 = await PIXI.Assets.load('imagenes/ui_menu/BOTONSALIR/boton_salir (2).png');
            this.texReiniciar = await PIXI.Assets.load('imagenes/ui_menu/BOTON REINICIO/boton_reinicio.png');
            this.texReiniciarApretado = await PIXI.Assets.load('imagenes/ui_menu/BOTON REINICIO/boton_reinicio_apretado.png');
            this.spritesheetFlechaItem = await PIXI.Assets.load('imagenes/fx/flecha/texture.json');

            /////////////////////////         PERSONAJE JUGABLE        /////////////////////////////

            const sheetPJ = await PIXI.Assets.load('imagenes/pj/texture.json'); //spritesheet animaciones
            this.jugador = new Jugador(sheetPJ, this);
            this.jugador.x = this.mapaAncho / 2;
            this.jugador.y = this.mapaAlto / 2;
            this.jugador.scale.set(2);
            this.mundo.addChild(this.jugador); 

            ///////////////////       BALAS - IMPACTO       //////////////////////

            this.sheetBalas = await PIXI.Assets.load('imagenes/fx/disp/texture.json');
            this.texturasBalas = Object.keys(this.sheetBalas.textures)
                .filter(key => key.includes("DISP"))
                .sort()//ordena los frames
                .map(key => this.sheetBalas.textures[key]);

            this.sheetImpactos = await PIXI.Assets.load('imagenes/fx/expl/texture.json');
            this.texturasImpacto = Object.keys(this.sheetImpactos.textures)
                .filter(key => key.includes("EXPL"))
                .sort()
                .map(key => this.sheetImpactos.textures[key]);

            /////////////////////////            ENEMIGOS            ////////////////////////////////

            this.sheetEnemigo = await PIXI.Assets.load('enemigos/FANTASMA/texture.json');
            this.sheetLobo = await PIXI.Assets.load('enemigos/LOBO/texture.json');
            this.sheetMurcielago = await PIXI.Assets.load('enemigos/MURCIELAGO/texture.json');
            const sheetEsqueleto0 = await PIXI.Assets.load('enemigos/ESQUELETO/texture-0.json');
            const sheetEsqueleto1 = await PIXI.Assets.load('enemigos/ESQUELETO/texture-1.json');
            this.sheetCaballo = await PIXI.Assets.load('enemigos/DUROS/CABALLO/texture.json');

            this.sheetEsqueleto = {
                textures: {
                    ...sheetEsqueleto0.textures,
                    ...sheetEsqueleto1.textures
                }
            };

            /////////////////////////////       CRONOMETRO DE PARTIDA     /////////////////////////////////

            this.tiempoTranscurrido = 0; 
            this.textoCronometro = new PIXI.Text({
                text: '0:00',
                style: { fill: 0xffffff, fontSize: 36, fontWeight: 'bold', stroke: { color: '#000000', width: 5 } }
            });
            this.textoCronorchetro = this.textoCronometro; //error de typeo
            this.textoCronometro.anchor.set(0.5, 0);
            this.textoCronometro.x = this.pixiApp.screen.width / 2;
            this.textoCronometro.y = 25; // altura del texto
            this.textoCronometro.visible = false; 

            ///////////////////////////          ORDEN DE LAS CAPAS         //////////////////////////////

            this.pixiApp.stage.addChild(this.mundo);
            this.pixiApp.stage.addChild(this.textoCronometro);
            this.pixiApp.stage.addChild(this.contenedorXP); 
            this.pixiApp.stage.addChild(this.contenedorInventario); 

            this.numerosDanio = []; 
            this.contenedorDanioUI = new PIXI.Container();
            // CAMBIA ESTO: En vez de agregar al stage, agregalo al mundo
            this.mundo.addChild(this.contenedorDanioUI);

            this.crearMenuPausa();
            this.crearMenuInstrucciones();
            this.crearMenuPrincipal();
            this.crearMenuSeleccionInicial();

        } catch (e) { 
            console.error("Error cargando assets:", e); //por las dudas
        }

        ////////////////////////////             FLECHA ITEMS              ////////////////////////////////

        const keysFlecha = Object.keys(this.spritesheetFlechaItem.textures);
        const texturasAnimFlecha = keysFlecha.map(k => this.spritesheetFlechaItem.textures[k]);

        this.flechaItem = new PIXI.AnimatedSprite(texturasAnimFlecha);
        this.flechaItem.anchor.set(0.5);
        this.flechaItem.animationSpeed = 0.15; 
        this.flechaItem.visible = false;
        this.flechaItem.play(); 

        ///interfaz con las estadisticas del personaje apretando escape
        this.contenedorStatsUI = new PIXI.Container();
        this.contenedorStatsUI.x = 20;  
        this.contenedorStatsUI.y = 100;  
        this.contenedorStatsUI.visible = false; 

        // orden de capas de la ui
        this.pixiApp.stage.addChild(this.flechaItem);

        // ui de pausa
        if (this.menuPausaUI) {
            this.pixiApp.stage.addChild(this.menuPausaUI);
        }

        // estadisticas del pj
        this.pixiApp.stage.addChild(this.contenedorStatsUI);

        ////////////////////////////////        EVENTOS Y TICKER         ////////////////////////////////////
        
        this.teclas = {};
        window.addEventListener('keydown', (e) => {
            this.teclas[e.code] = true;
            
            if ((e.code === 'KeyP' || e.code === 'Escape') && !this.enMenuPrincipal) {
                this.togglePausa();
            }
            
            if (this.jugador && e.code === 'Space' && !this.juegoPausado && !this.enMenuPrincipal) {
                if (e.repeat) return; 

                const disparoExitoso = this.jugador.disparar(); //detecta si se hizo el disparo para accionar el fx
                if (disparoExitoso === true && this.sonidos) {
                    this.sonidos.reproducir('disparo'); 
                }
            }
        });
        window.addEventListener('keyup', (e) => this.teclas[e.code] = false);

        this.pixiApp.stage.eventMode = 'static';
        this.pixiApp.stage.hitArea = this.pixiApp.screen;

        this.pixiApp.stage.on('pointerdown', (evento) => {
            // Validamos las mismas condiciones del Ticker y de la barra espaciadora
            if (this.jugador && !this.enMenuPrincipal && !this.juegoPausado && !this.eligiendoItemInicial) {
                
                const disparoExitoso = this.jugador.disparar();
                if (disparoExitoso === true && this.sonidos) {
                    this.sonidos.reproducir('disparo');
                }
            }
        });

        ////////////////////////////         TICKER PRINCIPAL          /////////////////////////////////////////

        this.pixiApp.ticker.add((ticker) => {   
            if (this.enMenuPrincipal || this.juegoPausado || this.eligiendoItemInicial || !this.jugador) return;

            const delta = ticker.deltaTime;
            
            // Cronometro
            this.tiempoTranscurrido += ticker.elapsedMS / 1000;
            const mins = Math.floor(this.tiempoTranscurrido / 60);
            const segs = Math.floor(this.tiempoTranscurrido % 60);
            this.textoCronometro.text = `${mins}:${segs < 10 ? '0' : ''}${segs}`;
            
            //Movimiento jugador
            let vx = 0, vy = 0;
            if (this.teclas['ArrowUp'] || this.teclas['KeyW']) vy = -1;
            if (this.teclas['ArrowDown'] || this.teclas['KeyS']) vy = 1;
            if (this.teclas['ArrowLeft'] || this.teclas['KeyA']) vx = -1;
            if (this.teclas['ArrowRight'] || this.teclas['KeyD']) vx = 1;

            if (vx !== 0 && vy !== 0) { 
                const mag = Math.sqrt(vx * vx + vy * vy); // El tema de las diagonales que iba mas rápido
                vx /= mag; 
                vy /= mag; 
            }

            if (vx !== 0 || vy !== 0) this.jugador.mover(vx, vy, delta);
            else this.jugador.detener();

            //Spawn de jefes
            this.planDeJefes.forEach(jefe => {
                if (this.tiempoTranscurrido >= jefe.tiempo && !jefe.aparecido) {
                    jefe.aparecido = true; 
                    this.jefeActivo = true; // Setear que el jefe está activo en el juego
                    this.spawnMiniJefe(jefe); 
                    
                    this.faseActual = jefe.faseQueActiva || 1; 
                    console.log(`¡EVENTO: Ha aparecido ${jefe.nombre.toUpperCase()}! Iniciando Fase ${this.faseActual}.`);
                }
            });

            //Camara - zoom
            this.mundo.scale.set(nivelZoom);
            let objX = (this.pixiApp.screen.width / 2) - (this.jugador.x * nivelZoom);
            let objY = (this.pixiApp.screen.height / 2) - (this.jugador.y * nivelZoom);
            this.mundo.position.set(objX, objY);

            if (this.fondo) {
                const factorVelocidad = 0.5; 
                this.fondo.tilePosition.x = (objX / (this.fondo.tileScale.x * nivelZoom)) * factorVelocidad;
                this.fondo.tilePosition.y = (objY / (this.fondo.tileScale.y * nivelZoom)) * factorVelocidad;
            }

            //Spawn enemigos comunes
            const jefeVivo = this.enemigos.some(en => en.esJefe && !en.muerto);
            const enemigosVivos = this.enemigos.filter(en => !en.muerto).length;
            this.timerSpawn += ticker.elapsedMS; 

            if (!jefeVivo) {
                this.jefeActivo = false; 
                
                if (enemigosVivos < this.limiteEnemigos) {
                    if (this.timerSpawn >= 200) { 
                        
                        if (this.oleadaCaballoActiva) {
                            let tipoElegido = '';
                            
                            // 60% de probabilidad de murciélagos
                            if (Math.random() < 0.60) {
                                tipoElegido = 'murcielago';
                            } else {
                                // 40% restante entre fantasma y esqueleto
                                tipoElegido = Math.random() < 0.5 ? 'fantasma' : 'esqueleto';
                            }
                            
                            // spawnea uno en especifico
                            this.spawnEnemigoUnitario(tipoElegido); 
                            
                        } else {
                            
                            this.spawnEnemigoUnitario();
                        }
                        
                        this.timerSpawn = 0;
                    }
                }
            }

            ////////////////       ACTUALIZA TICKER - ENTIDADES - FLECHA - ITEMS       //////////////////
            // Coordina el jugador tick a tick /tambien el cooldown en jugador
            if (typeof this.jugador.update === 'function') {
                this.jugador.update(delta);
            }
            this.actualizarEntidades(delta);
            this.actualizarFlecha();
            this.actualizarItems(delta);

            if (this.aliados) {
                this.aliados.forEach(aliado => {
                    if (typeof aliado.update === 'function') {
                        aliado.update(delta);
                    }
                });
            }

            // >>> AGREGA EL BUCLE DE ANIMACIÓN DEL DAÑO ACÁ:
            for (let i = this.numerosDanio.length - 1; i >= 0; i--) {
                const num = this.numerosDanio[i];
                num.sprite.y -= 0.8 * delta; // Multiplicado por delta para ir suave
                num.vida--;

                if (num.vida < 20) {
                    num.sprite.alpha = num.vida / 20;
                }

                if (num.vida <= 0) {
                    this.contenedorDanioUI.removeChild(num.sprite);
                    num.sprite.destroy();
                    this.numerosDanio.splice(i, 1);
                }
            }

        }); ///------------CIERRA EL TICKER-----------//

    }  /////////------------------------CIERRA INIT-------------------------////////////

    registrarItemEnInventarioVisual(itemData) {
        // Busca el primer slot que no este ocupado
        const slotLibre = this.slotsInventario.find(slot => !slot.ocupado);

        if (!slotLibre) {
            console.log("¡Inventario lleno! No se pueden equipar más de 8 ítems.");
            return;
        }

        // Crea el icono visual usando la textura del ítem
        if (itemData && itemData.textura) {
            const iconoSprite = new PIXI.Sprite(itemData.textura);
            
            // Centra el icono dentro del slot
            iconoSprite.anchor.set(0.5);
            iconoSprite.x = 17.5; // Busca el centro del slot
            iconoSprite.y = 17.5;
            
            // Escala del item
            iconoSprite.width = 24;
            iconoSprite.height = 24;

            slotLibre.addChild(iconoSprite); //pone el icono del item en el slot
            slotLibre.icono = iconoSprite;
            slotLibre.ocupado = true;
            slotLibre.itemDataId = itemData.nombre; //identifica el item
            
        }
    }

    spawnItem(item, distanciaPersonalizada = 2500) {
        const distancia = distanciaPersonalizada; //ajustamos a que rango de distancia queremos que spawnee el item
        const angulo = Math.random() * Math.PI * 2;
        const x = this.jugador.x + Math.cos(angulo) * distancia;
        const y = this.jugador.y + Math.sin(angulo) * distancia;

        // usa la textura propia del ítem
        const itemFisico = new ItemFisico(x, y, item, item.textura || this.texIconoAjo);

        this.mundo.addChild(itemFisico);
        this.itemsMapa.push(itemFisico);

        if (!this.itemObjetivo) {
            this.itemObjetivo = itemFisico;
        }

        return itemFisico;
    }

    dropearItemAleatorio() {
        if (!this.poolItems || this.poolItems.length === 0) return;

        // selecciona un ítem al azar del pool
        const indiceAleatorio = Math.floor(Math.random() * this.poolItems.length);
        const itemElegido = this.poolItems[indiceAleatorio];

        this.spawnItem(itemElegido, 650);
    }


    ///////////////////              ACTUALIZA ENTIDADES                /////////////////////////

    actualizarEntidades(delta) {

        ///////////////////           AJO/EMANAR         /////////////////////////

        if (this.jugador) {
            if (this.jugador.tieneAjo) {
                this.jugador.timerAjo += delta * 16.66;

                if (this.jugador.timerAjo >= (this.jugador.stats.cooldownAjo || 1000)) {
                    this.enemigos.forEach(en => {
                        if (en.muerto || en.vidaActual <= 0) return;

                        const dx = en.x - this.jugador.x;
                        const dy = en.y - this.jugador.y;
                        const distancia = Math.sqrt(dx * dx + dy * dy); //calcula la distancia con pitagoras

                        if (distancia <= this.jugador.stats.radioAjo) {
                            const danioAjo = this.jugador.stats.danioAjo || 1;
                            en.recibirDanio(danioAjo); //si el enemigo esta dentro del radio del ajo toma daño
                            
                            // >>> IMPACTO DE AJO REGISTRADO VISUALMENTE:
                            this.mostrarNumeroDanio(en.x, en.y, danioAjo);
                            
                            if (distancia > 0) { 
                                const dirX = dx / distancia;
                                const dirY = dy / distancia;                                                                                                                                                                    
                                const fuerzaEmpuje = 65; 

                                en.x += dirX * fuerzaEmpuje;
                                en.y += dirY * fuerzaEmpuje;
                            }

                            if (en.vidaActual <= 0) {
                                en.muerto = true;
                                if (typeof en.morir === "function") en.morir();
                            }
                        }
                    });
                    this.jugador.timerAjo = 0;
                }
            } else {
                if (this.jugador.auraAjo) {
                    this.jugador.auraAjo.visible = false;
                }
            }
        }

        ////////////////               BALAS                     ////////////////////

        this.balas = this.balas.filter(bala => {
            if (!bala.parent) return false;
            bala.actualizar(delta);
            let destruida = false;

            this.enemigos.forEach(en => {
                if (en.muerto || en.vidaActual <= 0) return;

                const d = Math.sqrt((en.x - bala.x)**2 + (en.y - bala.y)**2);
                const radioColision = 30 * en.scale.x; 

                if (d < radioColision) { 
                    destruida = true; //las balas colisionan contra los enemigos y se destruyen
                    
                    const danioBala = this.jugador.stats.danio;
                    en.recibirDanio(danioBala);
                    
                    // >>> IMPACTO DE BALA REGISTRADO VISUALMENTE:
                    this.mostrarNumeroDanio(en.x, en.y, danioBala);
                    
                    if (en.vidaActual <= 0) {
                        en.muerto = true;
                        if (typeof en.morir === "function") en.morir();
                    }
                }
            });

            if (destruida) { bala.eliminar(); return false; }
            return true;
        });

        /////////////////          ACTUALIZACION DE ENEMIGOS VIVOS            //////////////////////

        const RADIO_DESPAWN = 1200; 

        this.enemigos = this.enemigos.filter(en => {
            // se fija si el enemigo que murio era un jefe para subir la dificultad
            if (en.muerto || en.vidaActual <= 0) {
                if (en.esJefe) {
                    this.jefeActivo = false;
                    console.log(`¡EL JEFE [${en.tipo ? en.tipo.toUpperCase() : 'BOSS'}] HA CAÍDO! La dificultad general aumenta.`);
                    
                    // si detecta un jefe tipo caballo activa su oleada de enemigos
                    if (en.tipo === 'caballo_maldito') {
                        this.oleadaCaballoActiva = true;
                        this.limiteEnemigos = this.limiteEnemigos * 2; // duplica el limite de enemigos
                    }
                }
                return false; 
            }

            const dx = en.x - this.jugador.x;
            const dy = en.y - this.jugador.y;
            const distanciaAlJugador = Math.sqrt(dx * dx + dy * dy); //pitagoras
            const radioColisionDanio = 25 * en.scale.x; 

            // jugador toma daño
            if (distanciaAlJugador < radioColisionDanio && !this.jugador.invulnerable) {
                const danioEnemigo = en.danio || 10; 
                this.recibirDanioJugador(danioEnemigo);
                this.sonidos.reproducir('tomaDanio');
            }

            // si el enemigo esta fuera de radio_despawn se lo spawnea en el otro extremo
            if (distanciaAlJugador > RADIO_DESPAWN && !en.esJefe) {
                this.reposicionarEnemigo(en);
            }

            en.actualizar(this.jugador.x, this.jugador.y, delta, this.enemigos);
            return true; 
        });

        //////////////// CHEQUEO MUERTE JEFE - ESTADO DE FASE ////////////////////

        this.enemigos.forEach(en => {
            if (en.muerto && en.esJefe && this.faseActual === 0) {
                this.faseActual = 1; 
            }
        });
    }
    mostrarNumeroDanio(x, y, cantidad) {
        const danioTexto = Math.round(cantidad).toString();
        const txt = new PIXI.Text({
            text: danioTexto,
            style: {
                fontFamily: 'arieal', // Usa tu fuente pixel art
                fontSize: 20,
                fill: 0xFFFFFF, // Color amarillo/dorado para el daño
                stroke: { color: 0x000000, width: 3 },
                fontWeight: 'bold'
            }
        });

        txt.anchor.set(0.5);
        txt.x = x + (Math.random() * 20 - 10);
        txt.y = y - 20;

   
        this.contenedorDanioUI.addChild(txt);

       
        this.numerosDanio.push({
            sprite: txt,
            vida: 45 
        });
    }

    /////////--------------------------TERMINA ACTUALIZAR ENTIDADES-----------------------------////////////

    ////////////////////        ACTUALIZAR FLECHA            /////////////////////

    actualizarFlecha() {
        if (this.enMenuPrincipal || this.juegoPausado) {
        this.flechaItem.visible = false;
        return;
    }
        //si no hay items no aparece la flecha
        if (!this.itemsMapa || this.itemsMapa.length === 0) {
            this.itemObjetivo = null;
            this.flechaItem.visible = false;
            return;
        }

        //busca el item mas cercano
        let itemMasCercano = null;
        let distanciaMinima = Infinity;

        this.itemsMapa.forEach(item => {
            if (item && item.parent) {
                const dx = item.x - this.jugador.x;
                const dy = item.y - this.jugador.y;
                const distancia = Math.sqrt(dx * dx + dy * dy);
                
                if (distancia < distanciaMinima) { //compara distancias hasta encontrar la menor
                    distanciaMinima = distancia;
                    itemMasCercano = item;  //fija el item al que va a señalar
                }
            }
        });

        // fija el item al que va a señalar la flecha
        this.itemObjetivo = itemMasCercano;

        // si no se encontró ninguno válido, sale
        if (!this.itemObjetivo) {
            this.flechaItem.visible = false;
            return;
        }

        this.flechaItem.visible = true;

        // angulo hacia el objeto mas cercano
        const dx = this.itemObjetivo.x - this.jugador.x;
        const dy = this.itemObjetivo.y - this.jugador.y;
        const angulo = Math.atan2(dy, dx);

        //la flecha se centra en la pantalla para orbitar al jugador
        const centroX = this.pixiApp.screen.width / 2;
        const centroY = this.pixiApp.screen.height / 2;
        
        const radioOrbita = 100; 

        this.flechaItem.x = centroX + Math.cos(angulo) * radioOrbita;
        this.flechaItem.y = centroY + Math.sin(angulo) * radioOrbita;

        const paso8Direcciones = Math.PI / 4; 
        const anguloRedondeado = Math.round(angulo / paso8Direcciones) * paso8Direcciones;

        this.flechaItem.anchor.set(0.5, 0.5);
        this.flechaItem.rotation = angulo - Math.PI / 15;
    }


    ////////////////////        ACTUALIZAR ITEMS            /////////////////////


    actualizarItems(delta) {
        this.itemsMapa = this.itemsMapa.filter(item => {
            item.actualizar(this.jugador, delta);

            const dx = item.x - this.jugador.x;
            const dy = item.y - this.jugador.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);

            if (distancia < 30) {
                this.jugador.agregarItem(item.itemData);
                this.registrarItemEnInventarioVisual(item.itemData || item); //si esta a menos de 30 de distancia agrega el item a su inventario logico y visual
                item.eliminar();
                if (this.sonidos) {
                this.sonidos.reproducir('agarraItem'); 
            }
                if (this.itemObjetivo === item) {
                    this.itemObjetivo = null;
                }
                return false;
            }
            return true;
        });

        if (!this.itemObjetivo && this.itemsMapa.length > 0) {
            this.itemObjetivo = this.itemsMapa[0];
        }
    }

    reposicionarEnemigo(en) {
        let dirX = 0, dirY = 0;
        if (this.teclas['KeyW'] || this.teclas['ArrowUp']) dirY = -1;
        if (this.teclas['KeyS'] || this.teclas['ArrowDown']) dirY = 1;
        if (this.teclas['KeyA'] || this.teclas['ArrowLeft']) dirX = -1;
        if (this.teclas['KeyD'] || this.teclas['ArrowRight']) dirX = 1;

        if (dirX === 0 && dirY === 0) {
            const angulo = Math.random() * Math.PI * 2;
            en.x = this.jugador.x + Math.cos(angulo) * 800;
            en.y = this.jugador.y + Math.sin(angulo) * 800;
        } else {
            const varianza = (Math.random() - 0.5) * 400; 
            en.x = this.jugador.x + (dirX * 800) + (dirY !== 0 ? varianza : 0);
            en.y = this.jugador.y + (dirY * 800) + (dirX !== 0 ? varianza : 0);
        }
    }

    recibirDanioJugador(cantidad) {
        if (this.jugador.invulnerable) return;

        if (this.jugador.stats) {
            this.jugador.stats.vidaActual -= cantidad;//se actualizan las estadisticas del pj
            
            if (this.jugador.interfazVida) {
                this.jugador.interfazVida.visible = true;//la barra de vida aparece cuando el pj toma daño y se actualiza
                this.jugador.actualizarBarra(); 
            }

            if (this.jugador.stats.vidaActual <= 0) {
                this.gameOver();
                return; 
            }
        } else {
            this.jugador.vidaActual -= cantidad;
            
            if (this.jugador.interfazVida) {
                this.jugador.interfazVida.visible = true;
                this.jugador.actualizarBarra();
            }

            if (this.jugador.vidaActual <= 0) {
                this.gameOver();
                return;
            }
        }

        //invulnerabilidad breve para que no tome daño constantemente // mientras hace animacion + sonido
        this.jugador.invulnerable = true;
        this.jugador.anim.tint = 0xFF0000;

        if (typeof this.jugador.reproducirDanio === 'function') {
            this.jugador.reproducirDanio();
        }
        
        setTimeout(() => {
            this.jugador.invulnerable = false;

            if (this.jugador) {
                this.jugador.estaRecibiendoDanio = false;
                if (this.jugador.anim) this.jugador.anim.tint = 0xFFFFFF;
            }
        }, 1000); //timeout desde haber tomado daño, pasa a estado no invulnerable, pasa a otra animacion y frena el sonido
        
    }


    /////////////////////////////           SPAWNS           ///////////////////////////////

    spawnEnemigo() {
        if (!this.jugador || !this.sheetEnemigo) return;
        
        const angulo = Math.random() * Math.PI * 2;
        const x = this.jugador.x + Math.cos(angulo) * 800;
        const y = this.jugador.y + Math.sin(angulo) * 800;

        let sheetElegida = this.sheetEnemigo; 
        let tipoEnemigo = 'fantasma';

        const enemi = new Enemigo(x, y, sheetElegida, tipoEnemigo);
        this.mundo.addChild(enemi);
        this.enemigos.push(enemi);
    }



    spawnEnemigoUnitario(tipoForzado = null) { //spawnea un tipo especificado de enemigo, si no spawnea fantasmas
    if (!this.jugador || !this.sheetEnemigo) return;

    let sheetElegida = this.sheetEnemigo;
    let tipoEnemigo = 'fantasma';
    const dado = Math.random();

    if (tipoForzado) {
        tipoEnemigo = tipoForzado;
        
        if (tipoForzado === 'lobo') sheetElegida = this.sheetLobo;
        else if (tipoForzado === 'esqueleto') sheetElegida = this.sheetEsqueleto;
        else if (tipoForzado === 'murcielago') sheetElegida = this.sheetMurcielago;
        else sheetElegida = this.sheetEnemigo; // fantasma
        
    } else {

        /////////// FASE 1 A 5 ///////////
        if (this.faseActual >= 1) {
            if (dado < 0.45) { 
                sheetElegida = this.sheetLobo;
                tipoEnemigo = 'lobo';
            } else if (dado < 0.85) { 
                sheetElegida = this.sheetEsqueleto;
                tipoEnemigo = 'esqueleto';
            } else { 
                if (Math.random() < 0.5) {
                    sheetElegida = this.sheetEnemigo;
                    tipoEnemigo = 'fantasma';
                } else {
                    sheetElegida = this.sheetMurcielago;
                    tipoEnemigo = 'murcielago';
                }
            }

        /////////// FASE 5 EN ADELANTE ///////////

        } else if (this.nivelActual >= 5) {
            if (dado < 0.50) {
                sheetElegida = this.sheetEsqueleto;
                tipoEnemigo = 'esqueleto';
            } else {
                if (Math.random() < 0.5) {
                    sheetElegida = this.sheetEnemigo;
                    tipoEnemigo = 'fantasma';
                } else {
                    sheetElegida = this.sheetMurcielago;
                    tipoEnemigo = 'murcielago';
                }
            }
        } else {
            if (Math.random() < 0.5) {
                sheetElegida = this.sheetEnemigo;
                tipoEnemigo = 'fantasma';
            } else {
                sheetElegida = this.sheetMurcielago;
                tipoEnemigo = 'murcielago';
            }
        }
    }

    //posicionamiento
    const anguloAleatorio = Math.random() * Math.PI * 2;
    let dirX = 0, dirY = 0;
    if (this.teclas['KeyW']) dirY = -1;
    if (this.teclas['KeyS']) dirY = 1;
    if (this.teclas['KeyA']) dirX = -1;
    if (this.teclas['KeyD']) dirX = 1;

    const centroX = this.jugador.x + (dirX * 400);
    const centroY = this.jugador.y + (dirY * 400);
    
    const x = centroX + Math.cos(anguloAleatorio) * 700;
    const y = centroY + Math.sin(anguloAleatorio) * 700;

    const enemi = new Enemigo(x, y, sheetElegida, tipoEnemigo.toLowerCase().trim());
    this.mundo.addChild(enemi);
    this.enemigos.push(enemi);

    }

    spawnMiniJefe(datos) {
        const angulo = Math.random() * Math.PI * 2;
        const x = this.jugador.x + Math.cos(angulo) * 700;
        const y = this.jugador.y + Math.sin(angulo) * 700;

        let sheet = this.sheetEnemigo; 
        if (datos.tipoBase === 'lobo') sheet = this.sheetLobo;
        if (datos.tipoBase === 'esqueleto') sheet = this.sheetEsqueleto;
        if (datos.tipoBase === 'caballo') sheet = this.sheetCaballo;

        const jefe = new Enemigo(x, y, sheet, datos.nombre);

            //estadisticas del jefe
        jefe.esJefe = true; 
        jefe.vida = datos.vida; 
        jefe.vidaActual = datos.vida;
        jefe.escalaBase = datos.escala;
        jefe.sprite.scale.set(datos.escala); 
        jefe.xpOtorga = datos.xp;    
        jefe.danio = datos.danio;
        
        jefe.sprite.tint = 0xFFADAD; 

        this.mundo.addChild(jefe);
        this.enemigos.push(jefe);

    }

    //////////////////////////////          FASES DEL JUEGO        ////////////////////////////////

    empezarJuego() {
        this.enMenuPrincipal = false;
        this.contenedorMenuInicio.visible = false;
        this.mundo.visible = true;
        this.fondo.visible = true;
        this.textoCronometro.visible = true;
        this.contenedorXP.visible = true; 

        if (this.jugador && this.jugador.interfazVida) {
            this.jugador.interfazVida.visible = true;
            this.jugador.actualizarBarra();
        }
        this.contenedorInventario.visible = true;
        this.contenedorStatsUI.visible = false;
        this.contenedorMenuInicio.visible = false;
        this.contenedorSeleccionInicial.visible = true;
        this.eligiendoItemInicial = true;//primera interfaz en el juego
        this.xpActual = 0;
        this.actualizarBarraXP();
    }

    empezarPartidaAccion() {
        // se activa cuando el jugador ya eligio su primer item y empieza la partida
        this.eligiendoItemInicial = false;
        this.enMenuPrincipal = false;
        this.mundo.visible = true;
        this.fondo.visible = true;
        this.textoCronometro.visible = true;
        this.contenedorXP.visible = true; 

        if (this.jugador && this.jugador.interfazVida) {
            this.jugador.interfazVida.visible = true;
            this.jugador.actualizarBarra();
        }
        this.contenedorStatsUI.visible = false;
    }


    crearMenuSeleccionInicial() {
    this.contenedorSeleccionInicial = new PIXI.Container();
    this.contenedorSeleccionInicial.visible = false;

    const fondoOpc = new PIXI.Graphics()
        .rect(0, 0, this.pixiApp.screen.width, this.pixiApp.screen.height)
        .fill({ color: 0x000000, alpha: 0.85 });
    this.contenedorSeleccionInicial.addChild(fondoOpc);

    const textoTitulo = new PIXI.Text({
        text: "ELIJE EL ITEM QUE APARECERA EN EL MAPA", 
        style: { fontFamily: 'alagard', fontSize: 30, fill: 0xffffff, fontWeight: 'bold' }
    });
    textoTitulo.anchor.set(0.5);
    textoTitulo.x = this.pixiApp.screen.width / 2;
    textoTitulo.y = this.pixiApp.screen.height * 0.15;
    this.contenedorSeleccionInicial.addChild(textoTitulo);

    const descripcionesItems = {
        'benevolencia': "Aumenta tu vida máxima y restaura por completo toda tu barra de salud.",
        'piedad': "Restaura 20 puntos de salud de forma inmediata (no puede superar la vida máxima).",
        'vigor': "Aumenta la fuerza y las estadísticas físicas base del personaje.",
        'compañero alado': "Invoca una paloma compañera que vuela alrededor atacando automáticamente a los monstruos.",
        'emanar': "Emana un aura mística que inflige daño continuo a los enemigos cercanos.",
        'frenesí': "Reduce el tiempo de recarga entre ataques, permitiéndote disparar mucho más rápido.",
        'foco': "Achica el cono de dispersión de tus disparos para lograr una precisión perfecta.",
        'botas': "Aumenta la velocidad de movimiento del jugador de forma permanente.",
        'prisa': "Aumenta la velocidad de movimiento del jugador de forma permanente.",
        'violencia': "Incrementa la cantidad de proyectiles disparados simultáneamente."
    };

    const todosLosItems = this.poolItems.map(objItem => {
        let nombreLimpio = objItem.nombre || "Item";
        let textoMostrar = nombreLimpio;
        
        if (nombreLimpio.toLowerCase() === 'benevolencia') textoMostrar = "Benevolencia\n(Vida Max)";
        else if (nombreLimpio.toLowerCase() === 'piedad') textoMostrar = "Piedad\n(Curación)";
        else if (nombreLimpio.toLowerCase() === 'emanar') textoMostrar = "Emanar\n(Ajo)";
        else if (nombreLimpio.toLowerCase() === 'vigor') textoMostrar = "Vigor\n(Fuerza)";
        else if (nombreLimpio.toLowerCase() === 'compañero alado') textoMostrar = "Compañero\nAlado";
        else if (['frenesí', 'frenesi'].includes(nombreLimpio.toLowerCase())) textoMostrar = "Frenesí\n(Cadencia)";
        else if (nombreLimpio.toLowerCase() === 'foco') textoMostrar = "Foco\n(Precisión)";
        else if (['botas', 'prisa'].includes(nombreLimpio.toLowerCase())) textoMostrar = "Botas\n(Prisa)";
        else if (['balas', 'violencia'].includes(nombreLimpio.toLowerCase())) textoMostrar = "Violencia\n(Balas)";

        let desc = objItem.descripcion || descripcionesItems[nombreLimpio.toLowerCase()] || "Un ítem especial con efectos únicos para tu personaje.";

        return {
            item: objItem,
            texto: textoMostrar,
            descripcion: desc
        };
    });

    for (let i = todosLosItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [todosLosItems[i], todosLosItems[j]] = [todosLosItems[j], todosLosItems[i]];
    }

    const opciones = todosLosItems.slice(0, 3);

    const txtDescripcion = new PIXI.Text({
        text: "",
        style: { 
            fontFamily: 'alagard', 
            fontSize: 20, 
            fill: 0x00CCFF, 
            align: 'center',
            wordWrap: true,
            wordWrapWidth: 550
        }
    });
    txtDescripcion.anchor.set(0.5);
    txtDescripcion.x = this.pixiApp.screen.width / 2;
    txtDescripcion.y = this.pixiApp.screen.height * 0.8;
    txtDescripcion.visible = false;
    this.contenedorSeleccionInicial.addChild(txtDescripcion);

    const anchoTarjeta = 180;
    const espacio = 60;
    const totalAncho = (anchoTarjeta * opciones.length) + (espacio * (opciones.length - 1));
    let xInicial = (this.pixiApp.screen.width - totalAncho) / 2 + (anchoTarjeta / 2);

    opciones.forEach((opc) => {
        const tarjeta = new PIXI.Container();
        tarjeta.x = xInicial;
        tarjeta.y = this.pixiApp.screen.height * 0.45;

        const fondoTarj = new PIXI.Graphics()
            .roundRect(-anchoTarjeta / 2, -120, anchoTarjeta, 240, 10)
            .fill({ color: 0x1a1a1a })
            .stroke({ color: 0x444444, width: 2 });
        tarjeta.addChild(fondoTarj);

        const icono = new PIXI.Sprite(opc.item.textura);
        icono.anchor.set(0.5);
        icono.scale.set(1.6);
        icono.y = -30;
        tarjeta.addChild(icono);

        const txtNombre = new PIXI.Text({
            text: opc.texto,
            style: { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold', align: 'center' }
        });
        txtNombre.anchor.set(0.5);
        txtNombre.y = 55;
        tarjeta.addChild(txtNombre);

        tarjeta.eventMode = 'static';
        tarjeta.cursor = 'pointer';

        // Al pasar el mouse por encima
        tarjeta.on('pointerover', () => {
            fondoTarj.clear().roundRect(-anchoTarjeta / 2, -120, anchoTarjeta, 240, 10)
                .fill({ color: 0x262626 }).stroke({ color: 0x00CCFF, width: 3 });
            tarjeta.scale.set(1.05);

            txtDescripcion.text = opc.descripcion;
            txtDescripcion.visible = true;
        });

        // Al sacar el mouse
        tarjeta.on('pointerout', () => {
            fondoTarj.clear().roundRect(-anchoTarjeta / 2, -120, anchoTarjeta, 240, 10)
                .fill({ color: 0x1a1a1a }).stroke({ color: 0x444444, width: 2 });
            tarjeta.scale.set(1.0);

            txtDescripcion.visible = false;
        });

        tarjeta.on('pointerdown', () => {
            this.contenedorSeleccionInicial.visible = false;
            this.spawnItem(opc.item, 700);
            this.empezarPartidaAccion();
        });

        this.contenedorSeleccionInicial.addChild(tarjeta);
        xInicial += anchoTarjeta + espacio;
    });

    this.pixiApp.stage.addChild(this.contenedorSeleccionInicial);
}

    volverAlMenu() {
        this.enMenuPrincipal = true;
        this.juegoPausado = false;
        this.menuPausaUI.visible = false; 
        this.contenedorStatsUI.visible = false;
        this.flechaItem.visible = false;
        this.mundo.visible = false; 
        this.fondo.visible = false;
        this.textoCronometro.visible = false;
        this.contenedorMenuInicio.visible = true;
        this.mundo.alpha = 1;
    }

    gameOver() {
        this.juegoPausado = true; 
        this.jugador.anim.tint = 0x333333; 
        this.jugador.anim.stop();


        if (this.sonidos) {
            this.sonidos.detener('musicaPartida');
            this.sonidos.reproducir('muerte');       //si esta en la fase de game over frena la musica de partida y pone la de muerte
        }

        // 2 segundos de pausa
        setTimeout(() => {

            if (this.sonidos) {
                this.sonidos.reproducir('musicaMenu'); //vuelve a la musica de menu
            }
            
            this.volverAlMenuMuerte(); // vuelve al menu inicial despues de morir
        }, 2000);
        

    }//------------TERMINA GAME OVER-------------//



    volverAlMenuMuerte() {
        //borra todas las entidades de la partida
        this.enemigos.forEach(en => en.parent && en.parent.removeChild(en));
        this.balas.forEach(ba => ba.parent && ba.parent.removeChild(ba));
        this.itemsMapa.forEach(it => it.parent && it.parent.removeChild(it));
        
        this.enemigos = [];
        this.balas = [];
        this.itemsMapa = [];

        //vuelve al jugador a su estado inicial
        if (this.jugador && typeof this.jugador.resetear === 'function') {
            this.jugador.resetear(); 
        }

        if (this.jugador && this.jugador.anim) {
            this.jugador.anim.tint = 0xFFFFFF; 
            this.jugador.anim.loop = true;
            if (typeof this.jugador.cambiarAnimacion === 'function') {
                this.jugador.cambiarAnimacion(this.jugador.texturasIdle);
            }
            this.jugador.anim.gotoAndPlay(0);
        }

        this.juegoPausado = false; 

        // vuelve el juego a su estado inicial
        this.nivelActual = 1;
        this.xpActual = 0;
        this.xpNecesaria = 100;
        this.limiteEnemigos = 25;
        this.textoNivel.text = `NIVEL: ${this.nivelActual}`;
        this.actualizarBarraXP();

  
        if (this.jugador && this.jugador.interfazVida) {
            this.jugador.interfazVida.visible = false;
        }

        //limpia uno por uno los slots
        if (this.slotsInventario && this.slotsInventario.length > 0) {
            this.slotsInventario.forEach(slot => {
                // Si el slot contiene un ícono visible de la partida anterior, lo removemos de PIXI
                if (slot.icono && slot.icono.parent) {
                    slot.removeChild(slot.icono);
                }
                // Reseteamos sus propiedades lógicas para que el juego sepa que están libres
                slot.icono = null;
                slot.ocupado = false;
                slot.itemDataId = null;
            });
        }

        // el inventario sigue visible
        if (this.contenedorInventario) {
            this.contenedorInventario.visible = true;
        }

        // el personaje vuelve a estar en el centro
        this.jugador.x = this.mapaAncho / 2;
        this.jugador.y = this.mapaAlto / 2;

        // resetea a fase 1, eliminando todos los jefes y la flecha
        this.tiempoTranscurrido = 0; 
        this.faseActual = 0;         
        this.planDeJefes.forEach(jefe => {
            jefe.aparecido = false;  
        });

        this.itemObjetivo = null;
        if (this.flechaItem) this.flechaItem.visible = false;

        this.volverAlMenu();

    }



    crearMenuPrincipal() {
    this.contenedorMenuInicio = new PIXI.Container();
    const fondo = new PIXI.Sprite(this.texturaFondoInicio);
    fondo.width = this.pixiApp.screen.width;
    fondo.height = this.pixiApp.screen.height;
    this.contenedorMenuInicio.addChild(fondo);

    const grupoBotones = new PIXI.Container();

    // chequeo de musica
    const desbloquearMusica = () => {
        if (this.enMenuPrincipal && this.sonidos) {
            // despierta la musica si estaba suspendida
            if (Howler && Howler.ctx && Howler.ctx.state === 'suspended') {
                Howler.ctx.resume().then(() => {
                    this.sonidos.detener('musicaMenu'); 
                    this.sonidos.reproducir('musicaMenu');
                });
            } else {
                // si ya estaba despierta se activa
                this.sonidos.detener('musicaMenu'); 
                this.sonidos.reproducir('musicaMenu');
            }
        }

        window.removeEventListener('click', desbloquearMusica);
        window.removeEventListener('keydown', desbloquearMusica);
    };


        ////////////////////////             BOTONES            //////////////////////////////

    const btnJugar = this.crearBotonUI(this.texJugar1, this.texJugar2, () => {
        // para que no interfiera con nada
        window.removeEventListener('click', desbloquearMusica);
        window.removeEventListener('keydown', desbloquearMusica);

        if (Howler && Howler.ctx) {
            Howler.ctx.resume().then(() => {
                this.sonidos.detener('musicaMenu');     
                this.sonidos.reproducir('musicaPartida'); //arranca la musica de la partida
            }).catch(err => {
                console.error("Error al reanudar el audio:", err);
            });
        } else {
            this.sonidos.detener('musicaMenu');
            this.sonidos.reproducir('musicaPartida');
        }

        this.empezarJuego(); 
    });

    const btnInst = this.crearBotonUI(this.texInst1, this.texInst2, () => {
        this.contenedorMenuInicio.visible = false;
        this.contenedorInstrucciones.visible = true;
    });
    const btnSalir = this.crearBotonUI(this.texSalir1, this.texSalir2, () => window.close());

    btnJugar.y = 0;
    btnInst.y = 100;
    btnSalir.y = 200;

    grupoBotones.addChild(btnJugar, btnInst, btnSalir);
    grupoBotones.x = this.pixiApp.screen.width / 2;
    grupoBotones.y = this.pixiApp.screen.height * 0.40; 
    this.contenedorMenuInicio.addChild(grupoBotones);
    this.pixiApp.stage.addChild(this.contenedorMenuInicio);

   
    window.removeEventListener('click', desbloquearMusica);
    window.removeEventListener('keydown', desbloquearMusica);
     
    //resetea los listeners y al interactuar en cualquier lado se inicia la musica
    window.addEventListener('click', desbloquearMusica);
    window.addEventListener('keydown', desbloquearMusica);

    }//------------------- TERMINA CREAR MENU PRINCIPAL --------------///////



    crearMenuInstrucciones() {
        this.contenedorInstrucciones = new PIXI.Container();
        this.contenedorInstrucciones.visible = false;
        const cuadro = new PIXI.Sprite(this.texturaCuadroInstrucciones);
        cuadro.width = this.pixiApp.screen.width;
        cuadro.height = this.pixiApp.screen.height;
        this.contenedorInstrucciones.addChild(cuadro);

        const btnVolver = this.crearBotonUI(this.texSalir1, this.texSalir2, () => {
            this.contenedorInstrucciones.visible = false;
            this.contenedorMenuInicio.visible = true;
        });
        btnVolver.x = this.pixiApp.screen.width / 2;
        btnVolver.y = this.pixiApp.screen.height * 0.92; 
        this.contenedorInstrucciones.addChild(btnVolver);
        this.pixiApp.stage.addChild(this.contenedorInstrucciones);
    }



    crearMenuPausa() {
        this.menuPausaUI = new PIXI.Container();
        const fondoP = new PIXI.Sprite(this.texturaMenuPausa);
        fondoP.anchor.set(0.5);
        this.menuPausaUI.addChild(fondoP);
        
        const grupoP = new PIXI.Container();
        
        const btnContinuar = this.crearBotonUI(this.texJugar1, this.texJugar2, () => this.togglePausa());
        
        //refresca la pagina
        const btnReiniciar = this.crearBotonUI(this.texReiniciar, this.texReiniciarApretado, () => {
            window.location.reload();
        });

        //tambien refresca la pagina
        const btnSalirP = this.crearBotonUI(this.texSalir1, this.texSalir2, () => {
            window.location.reload();
        });

        btnContinuar.y = 0;
        btnReiniciar.y = 90;
        btnSalirP.y = 180;

        grupoP.addChild(btnContinuar, btnReiniciar, btnSalirP);
        grupoP.y = -140; 
        this.menuPausaUI.addChild(grupoP);

        //contenedor de estadisticas cuando apretamos escape
        if (this.contenedorStatsUI) {
            this.contenedorStatsUI.x = -150; 
            this.contenedorStatsUI.y = 100;  
            this.menuPausaUI.addChild(this.contenedorStatsUI);
        }

        this.menuPausaUI.position.set(this.pixiApp.screen.width / 2, this.pixiApp.screen.height / 2);
        this.menuPausaUI.visible = false;
        this.pixiApp.stage.addChild(this.menuPausaUI);

        if (this.menuPausaUI && this.contenedorStatsUI) {
            this.menuPausaUI.addChild(this.contenedorStatsUI);
            this.contenedorStatsUI.x = -120; 
            this.contenedorStatsUI.y = -50;  
        }
    }



    togglePausa() {
        this.juegoPausado = !this.juegoPausado;

        if (this.juegoPausado) {
            // aparece menu de pausa
            if (this.menuPausaUI) this.menuPausaUI.visible = true;
            
            if (this.flechaItem) this.flechaItem.visible = false;//desaparece la flecha
            
            if (this.contenedorStatsUI) {
                this.contenedorStatsUI.visible = true;
                if (typeof this.actualizarEstadisticasEnPantalla === 'function') {
                    this.actualizarEstadisticasEnPantalla();//actualiza las estadisticas
                }
            }
        } else {
            //se vuelve a la partida
            if (this.menuPausaUI) this.menuPausaUI.visible = false;
            if (this.contenedorStatsUI) this.contenedorStatsUI.visible = false; //desaparecen las estadisticas
            
            if (this.flechaItem && this.itemsMapa && this.itemsMapa.length > 0) {
                this.flechaItem.visible = true;
            }//actualizarFlecha decide si debe aparecer nuevamente o no
        }
    }



    actualizarEstadisticasEnPantalla() {
        // borra los datos y vuelve a crearlos ahora actualizados
        this.contenedorStatsUI.removeChildren();

        if (!this.jugador || !this.jugador.stats || this.enMenuPrincipal || this.eligiendoItemInicial) {
            this.contenedorStatsUI.visible = false;
            return;
        }
        const stats = this.jugador.stats;
        
        const listaStats = [
            `VIDA: ${Math.round(stats.vidaActual)} / ${stats.vidaMax}`,
            `DAÑO: ${stats.danio.toFixed(1)}`,
            `VELOCIDAD: ${stats.velocidad.toFixed(1)}`,
            `BALAS: ${stats.cantidadBalas}`,
            `CADENCIA: ${(stats.cooldown / 1000).toFixed(2)}s`
        ];

        if (this.jugador.tieneAjo) {
            listaStats.push(`DMG AJO: ${stats.danioAjo.toFixed(1)}`);
        }

        const espacioEntreLineas = 40; // espacio entre renglones

        listaStats.forEach((linea, indice) => {
            const txtStat = new PIXI.Text({
                text: linea,
                style: {
                    fontFamily: 'alagard', 
                    fontSize: 24, 
                    fill: 0xffffff, 
                    stroke: { color: 0x000000, width: 4 }
                }
            });
            
            
            txtStat.anchor.set(0, 0.5);
            txtStat.x = 0; 
            txtStat.y = indice * espacioEntreLineas;

            this.contenedorStatsUI.addChild(txtStat);
        });
    }


    crearBotonUI(texNormal, texHover, accion) {
        const contenedor = new PIXI.Container();
        const sp = new PIXI.Sprite(texNormal);
        sp.anchor.set(0.5);
        
        contenedor.addChild(sp);
        contenedor.eventMode = 'static';
        contenedor.cursor = 'pointer';

        contenedor.on('pointerover', () => {
            sp.texture = texHover;
            contenedor.scale.set(1.05); 
        });

        contenedor.on('pointerout', () => {
            sp.texture = texNormal;
            contenedor.scale.set(1.0);
        });

        contenedor.on('pointerdown', accion);
        return contenedor;
    }


    ganarXP(cantidad) {
        this.xpActual += cantidad;
        
        while (this.xpActual >= this.xpNecesaria) { //sube de nivel
            

            // resta los puntos actuales en vez de resetear la barra a 0 por cada nuevo nivel para conservar el numero de xp total
            this.xpActual -= this.xpNecesaria;
            
            // sube el requisito de puntos
            this.xpNecesaria = Math.floor(this.xpNecesaria * 1.3);
            
            this.limiteEnemigos += 5; 
            this.nivelActual++; 
            this.textoNivel.text = `NIVEL: ${this.nivelActual}`;

            //droppea item
            if (this.nivelActual % 5 === 0) {
                console.log(`¡Nivel ${this.nivelActual} alcanzado! Recompensa dropeada en el mapa.`);
                this.dropearItemAleatorio();
            }
        }

        this.actualizarBarraXP();
    }


    iniciarMusicaJuego() {
        if (this.sonidos) {
            this.sonidos.frenar('musicaMenu'); // frena musica del menu
            this.sonidos.reproducir('musicaFondo'); // pone musica de partida
        }
    }

    activarInterfazJuego() {
        //aparecen las estadisticas
        if (this.contenedorXP) this.contenedorXP.visible = true;
        if (this.contenedorInventario) this.contenedorInventario.visible = true;
        if (this.textoCronometro) this.textoCronometro.visible = true;
        if (this.fondo) this.fondo.visible = true;
        if (this.mundo) this.mundo.visible = true;
    }
}