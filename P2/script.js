let clave = [];
let intentos = 7;
let juegoActivo =  true;

// generar clave (4 numeros distintos)
function generarClave(){
    let nums = [];

    while(nums.length < 4){
        let n = Math.floor(Math.random()*10);
        if(!nums.includes(n)){
            nums.push(n);
        }
    }
    return nums;
}

// iniciar partida
function iniciarJuego(){
    clave = generarClave();
    intentos = 7;
    juegoActivo = true;

    document.getElementById("intentos").textContent = intentos;
    document.getElementById("mensaje").textContent = "Nueva partida preparada"

    // ocultar clave
    let casillas = document.querySelectorAll(".casilla");
    casillas.forEach(c => {
        c.textContent = "*";
        c.style.color = "red";
    });

    // activar botones
    document.querySelectorAll(".digito").forEach(b => {
        b.disabled = false;
    });

    resetCrono();
}

// pulsar número
function pulsarNumero(numero, boton){
    if(!juegoActivo) return;
    iniciarCrono(); //arranca al primer click

    boton.disabled = true;

    intentos--;
    document.getElementById("intentos").textContent = intentos;

    let casillas = document.querySelectorAll(".casilla");

    if(clave.includes(numero)){

        for(let i=0; i<4; i++){
            if(clave[i] == numero){
                casillas[i].textContent = numero;
                casillas[i].style.color = "lime";
            }
        }
    }

    comprobarVictoria();
    
    if(intentos === 0){
        perder();
    }
}

// comprobar si gana
function comprobarVictoria(){

    let casillas = document.querySelectorAll(".casilla");
    let aciertos = 0;

    casillas.forEach(c => {
        if(c.textContent !== "*"){
            aciertos++;
        }
    });

    if(aciertos === 4){

        pararCrono();
        juegoActivo = false;

        document.getElementById("mensaje").textContent = '¡GANASTE! Tiempo: ${document.getElementById("tiempo").textContent} | Intentos usados: ${7-intentos} | Restantes: ${intentos}';

    }
}

// perder
function perder(){

    pararCrono();
    juegoActivo = false;

    document.getElementById("mensaje").textContent = "Has perdido. Clave: " + clave.join("");
}

// asignar eventos a botones
function configurarBotones(){

    let botones = document.querySelectorAll(".digito");

    botones.forEach(b => {
        b.addEventListener("click", () => {
            let numero = parseInt(b.textContent);
            pulsarNumero(numero, b);
        });
    });

    document.getElementById("start").onclick = iniciarCrono;
    document.getElementById("stop").onclick = pararCrono;
    document.getElementById("reset").onclick = iniciarJuego;
}

// iniciar todo
window.onload = () => {
    configurarBotones()
    iniciarJuego();
};