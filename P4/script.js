// ================= CONFIG =================
const NIVELES = [
    { vel: 550 }, // Nivel 1
    { vel: 480 }, // Nivel 2
    { vel: 410 }, // Nivel 3
    { vel: 340 }, // Nivel 4
    { vel: 280 }  // Nivel 5
];

const PALABRAS = {
    "cama-casa": ["CAMA", "CASA"],
    "pato-gato": ["PATO", "GATO"],
    "luna-cuna": ["LUNA", "CUNA"]
};

// ================= ESTADO =================
let nivelActual = 0;
let posActual = 0;
let jugando = false;
let pausado = false; 
let timerBeat = null;
let musicaActiva = false;
let patronActual = [];

let miCronometro; 
let musica = new Audio("musicaintro.mp3");
musica.loop = true;

// ================= DOM =================
const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");

// Inicializamos el cronómetro con el elemento del HTML
miCronometro = new Cronometro(document.getElementById("display-tiempo"));

// ================= FUNCIONES =================

function generarPatronAleatorio() {
    let nuevoPatron = [];
    for (let i = 0; i < 8; i++) {
        nuevoPatron.push(Math.round(Math.random())); 
    }
    return nuevoPatron;
}

function iniciarJuego() {
    // Limpieza de seguridad
    clearInterval(timerBeat);
    if (miCronometro) miCronometro.stop();
    
    jugando = true;
    pausado = false;
    
    nivelActual = parseInt(document.getElementById("nivel-inicial").value);

    // Reset visual de botones
    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");

    bloquearControles(true);
    miCronometro.reset();
    miCronometro.start();

    if (musicaActiva) {
        musica.currentTime = 0; 
        musica.play().catch(e => console.log("Audio bloqueado o no encontrado"));
    }
    
    prepararRonda();
}

function prepararRonda() {
    if (!jugando) return;
    if (nivelActual > 4) {
        finalizarJuego("🎉 ¡Juego completado!");
        return;
    }

    patronActual = generarPatronAleatorio();
    posActual = 0; 

    dibujarTableroEstatico();
    
    // Mostramos información visual
    document.getElementById("display-estado").innerText = "Preparando...";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    // CAMBIO CLAVE: 
    // Para el nivel 1, esperamos a que el cronómetro llegue a 2 segundos (2000ms).
    // Para los siguientes niveles, mantenemos la misma pausa de 2 segundos 
    // entre que termina uno y empieza el siguiente para que sea rítmico.
    setTimeout(iniciarRonda, 2000); 
}

function iniciarRonda() {
    if (!jugando || pausado) return;

    document.getElementById("display-estado").innerText = "Jugando";
    document.getElementById("display-nivel").innerText = `${nivelActual + 1}/5`;

    const config = NIVELES[nivelActual];
    const palabras = PALABRAS[document.getElementById("secuencia").value];

    const realizarSalto = () => {
        // Limpiamos resaltado anterior
        cells.forEach(c => c.classList.remove("active"));

        if (posActual < 8) {
            cells[posActual].classList.add("active");
            let tipo = patronActual[posActual];
            wordDisplay.innerText = palabras[tipo];
            posActual++;
        } else {
            // Cuando termina la secuencia de 8, paramos este intervalo
            clearInterval(timerBeat);
            nivelActual++;
            // Llamamos a la preparación del siguiente nivel
            prepararRonda();
        }
    };

    // Encendido instantáneo de la primera casilla al terminar la preparación
    realizarSalto();

    // Iniciamos el ciclo para las 7 casillas restantes
    timerBeat = setInterval(realizarSalto, config.vel);
}

function pausarJuego() {
    if (!jugando || pausado) return;

    pausado = true;
    clearInterval(timerBeat);
    miCronometro.stop();
    musica.pause();

    document.getElementById("display-estado").innerText = "Pausado";
    
    btnPause.classList.add("hidden");
    btnResume.classList.remove("hidden");
    bloquearControles(false); 
}

function reanudarJuego() {
    if (!pausado) return;

    pausado = false;
    bloquearControles(true); 

    miCronometro.start();
    if (musicaActiva) musica.play();

    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");
    
    iniciarRonda(); 
}

function finalizarJuego(msg) {
    jugando = false;
    pausado = false;
    clearInterval(timerBeat);
    miCronometro.stop();
    musica.pause();
    
    wordDisplay.innerText = msg;
    document.getElementById("display-estado").innerText = "Finalizado";
    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");
    bloquearControles(false);
}

function bloquearControles(bloquear) {
    document.getElementById("secuencia").disabled = bloquear;
    document.getElementById("nivel-inicial").disabled = bloquear;
    btnStart.disabled = bloquear; 
}

// ================= EVENTOS =================
btnStart.addEventListener("click", iniciarJuego);
btnPause.addEventListener("click", pausarJuego);
btnResume.addEventListener("click", reanudarJuego);

btnAudio.addEventListener("click", () => {
    musicaActiva = !musicaActiva;
    btnAudio.innerText = musicaActiva ? "Música: ON" : "Música: OFF";
    if (musicaActiva && jugando && !pausado) {
        musica.play().catch(e => console.log("Error al reproducir"));
    } else {
        musica.pause();
    }
});