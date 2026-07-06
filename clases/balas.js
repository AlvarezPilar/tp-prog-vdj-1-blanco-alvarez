class Bala extends PIXI.Container {
    constructor(x, y, dirX, dirY, angulo, danio, texturasBalas) {
        super();
        
        // posición inicial
        this.x = x;
        this.y = y;

        this.dirX = dirX;
        this.dirY = dirY;

        // daño de los stats del jugador
        this.danio = danio;
        this.velocidad = 15;

        // si no tiene angulo previo, se calcula
        const anguloBala = angulo !== undefined ? angulo : Math.atan2(dirY, dirX);

        // velocidad segun vertice
        this.velocidadX = Math.cos(anguloBala) * this.velocidad;
        this.velocidadY = Math.sin(anguloBala) * this.velocidad;


        ////////////////------------TEXTURA-------------////////////////////

    
        if (texturasBalas && texturasBalas.length > 0) {
            this.sprite = new PIXI.AnimatedSprite(texturasBalas);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.3;
            this.sprite.scale.set(2);
            this.sprite.play();
            this.addChild(this.sprite);
        } else {
            //en caso de que no se registren las texturas pone un circulo
            const graficoRespaldo = new PIXI.Graphics().circle(0, 0, 5).fill(0xffff00);
            this.addChild(graficoRespaldo);
        }

        // le da la rotacion de su angulo
        this.rotation = anguloBala;
    }

    actualizar(delta) {
        this.x += this.velocidadX * delta;
        this.y += this.velocidadY * delta;
    }

    eliminar() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.destroy({ children: true });
    }
}