class Personaje extends PIXI.Container {
    constructor(x, y, juego) {
        super(); // Llama al constructor de PIXI.Container
        this.juego = juego;

        // Posición inicial en el contenedor nativo de PIXI
        this.x = x;
        this.y = y;

        // Añadimos este personaje al mundo del juego de forma automática
        if (this.juego && this.juego.mundo) {
            this.juego.mundo.addChild(this);
        } else if (this.juego && this.juego.pixiApp) {
            this.juego.pixiApp.stage.addChild(this);
        }

        // Vectores físicos (Por si vas a usar físicas con aceleración)
        this.velocidad = {
            x: 0,
            y: 0,
        };

        this.aceleracion = {
            x: 0,
            y: 0,
        };
    }
}

////////////// AL FINAL NO LA USAMOS///////////////////////////////////
