class Item {

    constructor(nombre, efecto, textura) {

        this.nombre = nombre;

        this.efecto = efecto;

        this.textura = textura;

        this.cantidad = 0;
    }

    aplicar(jugador) {

        this.cantidad++;

        this.efecto(jugador);
    }
}



