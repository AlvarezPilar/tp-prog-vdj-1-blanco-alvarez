class GestorSonidos {
    constructor() {
        this.bancoSonidos = {};
        this.muteado = false;
        
        // Volumen
        this.volumenMusica = 0.1;
        this.volumenEfectos = 0.5;

        this._cargarSonidos();
    }

    _cargarSonidos() {
    this.bancoSonidos['musicaMenu'] = new Howl({
        src: ['sonidos/musica_menu.mp3'],
        loop: true,
        html5: false, 
        preload:false, //para que no arranque apenas se abre el juego sino se buguea
        pool: 1, // Fuerza a usar un solo canal
        volume: this.volumenMusica
    });

    this.bancoSonidos['musicaPartida'] = new Howl({
        src: ['sonidos/en_partida.mp3'],
        loop: true,
        html5: false, 
        preload:false,
        pool: 1,
        volume: this.volumenMusica
    });

    // Efectos
    const efectos = {
        disparo: 'sonidos/disparo.mp3',
        tomaDanio: 'sonidos/toma_daño.mp3',
        agarraItem: 'sonidos/agarra_item.mp3',
        apretaBoton: 'sonidos/apreta_boton.mp3',
        mouseSobreBoton: 'sonidos/mouse_sobre_boton.mp3',
        muerte: 'sonidos/muerte.mp3',
        subeNivel: 'sonidos/sube_nivel.mp3'
    };

    for (let clave in efectos) {
        this.bancoSonidos[clave] = new Howl({
            src: [efectos[clave]],
            html5: false,
            pool: 10,     //Deja que los disparos se spuerpongan
            volume: this.volumenEfectos
        });
    }
}

    // Reproduccion de audio
    reproducir(nombre) {
    if (this.muteado) return;
    
    const sonido = this.bancoSonidos[nombre];
    if (sonido) {
        // Si el archivo no esta cargado
        if (sonido.state() === 'unloaded') {
            // le da play cuando lo esté
            sonido.once('load', () => {
                sonido.play();
            });
            sonido.load();
        } else {
            // Si ya estaba cargado le da play
            sonido.play();
        }
    } else {
        console.warn(`El sonido "${nombre}" no existe.`);
    }
}

    // Método para detener
    detener(nombre) {
        const sonido = this.bancoSonidos[nombre];
        if (sonido) {
            sonido.stop();
        }
    }
}