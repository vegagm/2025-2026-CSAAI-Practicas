// ================= CONFIG =================
// Tiempos ajustados rítmicamente al audio musicafondo2.m4a
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
// let musica = new Audio("musicaintro.mp3");
let musica = new Audio("musicafondo2.m4a");
musica.loop = true;

// ================= DOM =================
const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");

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
    clearInterval(timerBeat);
    if (miCronometro) miCronometro.stop();
    
    jugando = true;
    pausado = false;
    nivelActual = parseInt(document.getElementById("nivel-inicial").value);

    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");

    bloquearControles(true);
    miCronometro.reset();
    miCronometro.start();

    if (musicaActiva) {
        musica.currentTime = 0; 
        musica.play().catch(e => console.log("Audio bloqueado"));
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
    
    document.getElementById("display-estado").innerText = "Preparando...";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    // --- LÓGICA DE TIEMPOS SOLICITADA ---
    // Si es el Nivel 1 (o el nivel elegido al inicio), esperamos 2 segundos.
    // Para los siguientes niveles (entremedias), solo 0.6 segundos.
    let tiempoEspera = (posActual === 0 && (nivelActual === parseInt(document.getElementById("nivel-inicial").value))) ? 2000 : 600;

    setTimeout(iniciarRonda, tiempoEspera);
}

function dibujarTableroEstatico() {
    const palabras = PALABRAS[document.getElementById("secuencia").value];
    cells.forEach((cell, index) => {
        cell.classList.remove("active");
        let tipo = patronActual[index];
        cell.innerText = palabras[tipo];
    });
}

function iniciarRonda() {
    if (!jugando || pausado) return;

    document.getElementById("display-estado").innerText = "Jugando";
    document.getElementById("display-nivel").innerText = `${nivelActual + 1}/5`;

    const config = NIVELES[nivelActual];
    const palabras = PALABRAS[document.getElementById("secuencia").value];

    const realizarSalto = () => {
        cells.forEach(c => c.classList.remove("active"));

        if (posActual < 8) {
            cells[posActual].classList.add("active");
            let tipo = patronActual[posActual];
            wordDisplay.innerText = palabras[tipo];
            posActual++;
        } else {
            clearInterval(timerBeat);
            nivelActual++;
            prepararRonda();
        }
    };

    realizarSalto();
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