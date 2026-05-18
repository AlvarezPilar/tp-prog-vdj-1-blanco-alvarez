class Bala extends PIXI.Container {
    constructor(x, y, dirX, dirY, angulo, danio, texturasBalas) {
        super();
        
        // Posición inicial
        this.x = x;
        this.y = y;

        // Guardamos las direcciones originales por si acaso
        this.dirX = dirX;
        this.dirY = dirY;

        // Guardamos el daño que viene de los stats del jugador
        this.danio = danio;

        // Velocidad base
        this.velocidad = 15;

        // Si el ángulo viene definido lo usamos, si no, lo calculamos con dirX y dirY
        const anguloBala = angulo !== undefined ? angulo : Math.atan2(dirY, dirX);

        // Calculamos los componentes de velocidad usando el ángulo
        this.velocidadX = Math.cos(anguloBala) * this.velocidad;
        this.velocidadY = Math.sin(anguloBala) * this.velocidad;

        // --- CONFIGURACIÓN DEL SPRITE ANIMADO
        // Usamos una verificación por si en algún momento no se pasan texturas, no rompa el juego
        if (texturasBalas && texturasBalas.length > 0) {
            this.sprite = new PIXI.AnimatedSprite(texturasBalas);
            this.sprite.anchor.set(0.5);
            this.sprite.animationSpeed = 0.3;
            this.sprite.scale.set(2);
            this.sprite.play();
            this.addChild(this.sprite);
        } else {
            // Respaldo gráfico en caso de que no cargue pone un circulito amarillo
            const graficoRespaldo = new PIXI.Graphics().circle(0, 0, 5).fill(0xffff00);
            this.addChild(graficoRespaldo);
        }

        // Rotamos el contenedor completo para que la bala mire hacia donde viaja
        this.rotation = anguloBala;
    }

    actualizar(delta) {
        // Movimiento suave usando delta
        this.x += this.velocidadX * delta;
        this.y += this.velocidadY * delta;
    }

    eliminar() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        this.destroy({ children: true }); // Limpia también el sprite animado interno de la memoria
    }
}