// console.log("Acierta la contraseña")
// alert("Acierta la clave antes de que explote 💣");

const mensaje = document.getElementById("mensaje");

const display = document.getElementById("display");
const crono = new Cronometro(display);

const botones = document.querySelectorAll(".tecla");
const intentosSpan = document.getElementById("intentos");

const casillas = [
    document.getElementById("c1"),
    document.getElementById("c2"),
    document.getElementById("c3"),
    document.getElementById("c4")
];

let clave = [];
let intentos = 7;
let jugando = false;
let iniciado = false;
let aciertos = 0;
let usados = []; //-- guardamos los numeros ya pulsados
let terminado = false; //-- variable para que no cuente negativo

//-- Generar la clave sin repeticiones
function generarClave() {
    clave = [];

    while (clave.length < 4) {
        let n = Math.floor(Math.random() * 10);
        if (!clave.includes(n)) {
            clave.push(n);
        }
    }

    console.log("CLAVE:", clave);
}

//-- Reseteamos el juego
function resetJuego() {
    generarClave();

    intentos = 7;
    intentosSpan.innerText = intentos;

    aciertos = 0;
    jugando = true;
    iniciado = false;
    usados = []; //--reiniciamos los usados
    terminado = false;

    casillas.forEach(c => {
        c.innerText = "*";
        c.style.color = "red";
    });

    botones.forEach(b => b.disabled = false);
    mensaje.innerText = "Nueva partida preparada. Pulsa Start o un número para comenzar.";

    crono.reset();
}

//-- click de los numeros
botones.forEach(boton => {
    boton.onclick = () => {

        if (terminado) return; //--Añadimos

        if (!jugando) return;

        let numero = boton.innerText;

        if (!iniciado) {
            crono.start();
            iniciado = true;
        }

        boton.disabled = true;

        //-- guardamos el número usado
        if(!usados.includes(numero)){
            usados.push(numero);
        }

        let acierto = false;

        clave.forEach((n, i) => {
            if (n == numero) {
                casillas[i].innerText = numero;
                casillas[i].style.color = "#000000";
                acierto = true;
                aciertos++;

                mensaje.innerText = `Has acertado el número ${numero}. Sigue así.`;
            }
        });

        intentos--;
        intentosSpan.innerText = intentos;

        //-- Ganar
        if (aciertos == 4) {
            jugando = false;
            terminado = true; //--terminamos el jjuego para que no cuente negativo
            crono.stop();

            let tiempo = display.innerText;

            mensaje.innerText = `¡Clave descubierta! Tiempo: ${tiempo} | Intentos consumidos: ${7 - intentos} | Intentos restantes: ${intentos}`;
        }

        //-- Perder
        if (intentos == 0 && aciertos < 4) {
            jugando = false;
            terminado = true; //--terminamos el juego para que no cuente negativo
            crono.stop();

            casillas.forEach((c, i) => {
                c.innerText = clave[i];
            });

            mensaje.innerText = `BOOM. Has agotado los intentos. La clave correcta era ${clave.join("-")}. Pulsa Reset para jugar otra vez.`;
        }
    };
});

//-- Botones de control
document.getElementById("start").onclick = () => {
            if(terminado){
                mensaje.innerText="La partida ha terminado. Pulsa RESET para volver a comenzar.";
                return;
            }

            crono.start();
            jugando = true;  //-- Reactivamos el juego

            //-- restaurar estado de botones
            botones.forEach(b => {
                if(!b.id) { //--solo botones númericos
                    if(usados.includes(b.innerText)){
                        b.disabled = true //-- mantener bloqueados
                    } else{
                        b.disabled = false; //-- desbloquear los no usados
                    }
                }
            });
            mensaje.innerText = "Cronómetro iniciado. ¡SUERTE!";
        }

document.getElementById("stop").onclick = () => {
            crono.stop();
            jugando = false;

            //-- bloqueamos todos mientras está en pausa
            botones.forEach(b => {
                if(!b.id){
                    b.disabled = true;
                }
            });

            mensaje.innerText = "Cronómetro detenido.";
        }

document.getElementById("reset").onclick = resetJuego;

// Inicio
resetJuego();