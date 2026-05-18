class ItemFisico extends PIXI.Container {

    constructor(x, y, itemData) {

        super(); //pixi.container

            ///ubicacion de la apariencia del item
        this.x = x;
        this.y = y;

        this.itemData = itemData;

        this.sprite = new PIXI.Sprite(
            itemData.textura
        );

        this.sprite.anchor.set(0.5);

        this.sprite.scale.set(0.5);

        this.addChild(this.sprite);


        this.texto = new PIXI.Text({
            text: itemData.nombre,
            style: new PIXI.TextStyle({
                fontFamily: "alagard",
                fontSize: 16,
                fill: "#ffffff"
            })
        });


        this.texto.anchor.set(0.5);

            //ubicacion del texto por sobre el item
        this.texto.y = -40;

        this.addChild(this.texto);
    }


    actualizar(jugador) {

        // sube y baja el texto
        this.texto.y =
            -40 + Math.sin(Date.now() * 0.005) * 5;

        // se achica y agranda el texto
        const escala =
            0.9 + Math.sin(Date.now() * 0.005) * 0.1;

        this.texto.scale.set(escala);

        // distancia al jugador
        const dx = jugador.x - this.x;

        const dy = jugador.y - this.y;

        const distancia = Math.sqrt(dx * dx + dy * dy); ///pitagoras

        // el texto es visible cuando el jugador esta cerca
        this.texto.visible = distancia < 200;
    }



    eliminar() {

        if (this.parent) {

            this.parent.removeChild(this);
        }

        this.destroy();
    }
}