class Cronometro {

    //-- Constructor del objeto tenemos que 
    //-- indicar el display donde mostrar el cronometro

    constructor(display) {
        this.display = display;
        this.cent = 0; //-- Centesimas
        this.seg = 0; //-- Segundos
        this.min = 0; //-- Minutos
        this.timer = null; //-- Temporizador
    } //-- Fin constructor

    //-- Método para ejecutar cada centesima
    tic() {
        this.cent++;

        //-- 100 centesimas hacen 1 seg
        if (this.cent == 100) {
            this.seg++;
            this.cent = 0;
        }

        //-- 60 segundos hacen un minuto
        if (this.seg == 60) {
            this.min++;
            this.seg = 0;
        }

        //-- Mostramos el valor 
        this.display.innerHTML = this.min + ":" + this.seg + ":" + this.cent;
    }

    //-- Arrancamos el cronometro
    start() {
        if (!this.timer) {
            this.timer = setInterval(() => this.tic(), 10);
        }
    } //-- Fin Start

    //-- Paramos el cronómetro
    stop() {
        clearInterval(this.timer);
        this.timer = null;
    } //-- Fin Stop

    //-- Reseteamos el cronometro
    reset() {
        this.cent = 0;
        this.seg = 0;
        this.min = 0;
        this.display.innerHTML = "0:0:0";
    } //-- Fin Reset
}//-- Fin clase cronometro