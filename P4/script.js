// ================= CONFIG =================
const NIVELES = [
    { vel: 1200 }, // Nivel 1
    { vel: 900  }, // Nivel 2
    { vel: 700  }, // Nivel 3
    { vel: 500  }, // Nivel 4
    { vel: 350  }  // Nivel 5
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
let pausado = false; // Nueva variable de estado
let timerBeat = null;
let musicaActiva = false;
let patronActual = []; // Aquí guardaremos el patrón aleatorio de la ronda

const miCronometro = new Cronometro(document.getElementById("display-tiempo"));
let musica = new Audio("musica_fondo.mp3");
musica.loop = true;

// ================= DOM =================
const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");

// ================= FUNCIONES =================

// Genera un array de 8 números (0 o 1) al azar
function generarPatronAleatorio() {
    let nuevoPatron = [];
    for (let i = 0; i < 8; i++) {
        nuevoPatron.push(Math.round(Math.random())); 
    }
    return nuevoPatron;
}

function iniciarJuego() {
    if (jugando) return;
    jugando = true;
    pausado = false;
    nivelActual = parseInt(document.getElementById("nivel-inicial").value);

    bloquearControles(true);
    miCronometro.reset();
    miCronometro.start();

    if (musicaActiva) musica.play();
    prepararRonda();
}

function prepararRonda() {
    if (!jugando) return;
    if (nivelActual > 4) {
        finalizarJuego("🎉 ¡Juego completado!");
        return;
    }

    // Generamos el patrón aleatorio para ESTA ronda específica
    patronActual = generarPatronAleatorio();
    posActual = 0; // Reiniciamos posición para la nueva ronda

    dibujarTableroEstatico();
    document.getElementById("display-estado").innerText = "Preparando...";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    setTimeout(iniciarRonda, 1500);
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

    timerBeat = setInterval(() => {
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
    }, config.vel);
}

const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");

// FUNCIÓN PARA PAUSAR (Antiguo Detener)
function pausarJuego() {
    if (!jugando || pausado) return;

    pausado = true;
    clearInterval(timerBeat);
    miCronometro.stop();
    musica.pause();

    document.getElementById("display-estado").innerText = "Pausado";
    
    // CAMBIO AQUÍ: Intercambiamos botones
    btnPause.classList.add("hidden");
    btnResume.classList.remove("hidden");
}

// FUNCIÓN PARA REANUDAR
function reanudarJuego() {
    if (!pausado) return;

    pausado = false;
    miCronometro.start();
    if (musicaActiva) musica.play();

    // CAMBIO AQUÍ: Intercambiamos botones de vuelta
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
    
    // Al terminar, nos aseguramos de que el botón de Detener sea el visible para la siguiente vez
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
    if (musicaActiva && jugando && !pausado) musica.play();
    else musica.pause();
});