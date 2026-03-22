console.log("Acierta la contraseña")
alert("Acierta la clave antes de que explote 💣");

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

    casillas.forEach(c => {
        c.innerText = "*";
        c.style.color = "red";
    });

    botones.forEach(b => b.disabled = false);

    crono.reset();
}

//-- click de los numeros
botones.forEach(boton => {
    boton.onclick = () => {

        if (!jugando) return;

        let numero = boton.innerText;

        if (!iniciado) {
            crono.start();
            iniciado = true;
        }

        boton.disabled = true;

        let acierto = false;

        clave.forEach((n, i) => {
            if (n == numero) {
                casillas[i].innerText = numero;
                casillas[i].style.color = "#00ff00";
                acierto = true;
                aciertos++;
            }
        });

        intentos--;
        intentosSpan.innerText = intentos;

        //-- Ganar
        if (aciertos == 4) {
            jugando = false;
            crono.stop();

            alert(
                "🎉 GANASTE\n" +
                "Tiempo: " + display.innerText + "\n" +
                "Intentos usados: " + (7 - intentos)
            );
        }

        //-- Perder
        if (intentos == 0 && aciertos < 4) {
            jugando = false;
            crono.stop();

            casillas.forEach((c, i) => {
                c.innerText = clave[i];
            });

            alert("💣 BOOM\nHas perdido\nClave: " + clave.join("-"));
        }
    };
});

//-- Botones de control
document.getElementById("start").onclick = () => crono.start();
document.getElementById("stop").onclick = () => crono.stop();
document.getElementById("reset").onclick = resetJuego;

// Inicio
resetJuego();