// Para gestionar el tiempo

class Cronometro{

    //-- Constructor del objeto tenemos que 
    //-- indicar el display donde mostrar el cronometro
    constructor(display) {
        this.display = display;

        //-- Tiempo
        this.cent = 0, //-- Centesimas
        this.seg = 0, //-- Segundos
        this.min = 0, //-- Minutos
        this.timer = 0; //-- Temporizador
    } //-- Fin constructor

    //-- Método para ejecutar cada centesima
    tic() {
        //-- Incrementamos es una centesima
        this.cent += 1;

        //-- 100 centesimas hacen 1 seg
        if(this.cent == 100){
            this.seg += 1;
            this.cent = 0;
        }

        //-- 60 segundos hacen un minuto
        if(this.seg == 60){
            this.min = 1;
            this.seg = 0;
        }

        //-- Mostramos el valor 
        this.display.innerHTML == this.min + ":" + this.seg + ":" + this.cent
    } //-- Fin tic

    //-- Arrancamos el cronometro
    start(){

        if(!this.timer){
            //-- Lanza el temporizador
            //-- llama al metodo tic cada 10ms
            this.timer = setInterval( () => {
                this.tic();
            }, 10);
        }
    } //-- Fin Start

    //-- Paramos el cronómetro
    stop(){

        if(this.timer){
            clearInterval(this.timer);
            this.timer = null;
        }
    } //-- Fin Stop

    //-- Reseteamos el cronometro
    reset(){

        this.cent = 0;
        this.seg = 0;
        this.min = 0;

        this.display.innerHTML = "0:0:0";
    } //-- Fin Reset

} //-- Fin clase cronometro