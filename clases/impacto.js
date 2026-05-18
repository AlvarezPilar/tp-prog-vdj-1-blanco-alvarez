class Impacto extends PIXI.Container {

    constructor(x, y, texturasImpacto) {

        super();

            ///posición inicial
        this.x = x;
        this.y = y;

        this.anim = new PIXI.AnimatedSprite(
            texturasImpacto
        );

        this.anim.anchor.set(0.5);
        this.anim.scale.set(2.5);


        this.anim.animationSpeed = 0.3;

            ///la animación solo sucede una vez
        this.anim.loop = false;

        this.anim.play();

        this.addChild(this.anim);

        this.anim.onComplete = () => {

            this.eliminar();
        };
            ///la animación termina y se elimina
    }

    eliminar() {

        if (this.parent) {

            this.parent.removeChild(this);
        }

        this.destroy();
    }
}