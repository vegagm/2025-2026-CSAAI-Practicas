// ================= CONFIGURACIÓN =================
const NIVELES = [
    { vel: 550 }, { vel: 480 }, { vel: 410 }, { vel: 340 }, { vel: 280 }
];

const PALABRAS = {
    "cama-casa": ["CAMA", "CASA"],
    "pato-gato": ["PATO", "GATO"],
    "luna-cuna": ["LUNA", "CUNA"]
};

// ================= ESTADO DEL JUEGO =================
let nivelActual = 0;
let posActual = 0;
let jugando = false;
let pausado = false;
let timerBeat = null;
let musicaActiva = false;
let patronActual = [];

let musica = new Audio("musicafondo2.m4a");
musica.loop = true;

const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");
const displayNivel = document.getElementById("display-nivel");
const displayEstado = document.getElementById("display-estado");

// Inicialización del cronómetro
const miCronometro = new Cronometro(document.getElementById("display-tiempo"));

// ================= FUNCIONES =================

function generarPatronAleatorio() {
    let nuevoPatron = [];
    for (let i = 0; i < 8; i++) {
        nuevoPatron.push(Math.round(Math.random())); 
    }
    return nuevoPatron;
}

function dibujarTableroEstatico() {
    const palabras = PALABRAS[document.getElementById("secuencia").value];
    cells.forEach((cell, index) => {
        cell.classList.remove("active");
        cell.innerText = palabras[patronActual[index]]; // Las palabras aparecen para que el usuario las lea
    });
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
        musica.play();
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
    dibujarTableroEstatico(); // AQUÍ aparecen las palabras para leer
    
    displayEstado.innerText = "¡Lee las tarjetas!";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    // TIEMPOS DE ESPERA PARA EL SILBIDO:
    // Nivel 1: Esperamos 2.1s (lectura) antes de que entre el silbido
    // Intermedios: 0.8s para sincronizar con la siguiente frase del silbido
    let esInicio = (nivelActual === parseInt(document.getElementById("nivel-inicial").value));
    let tiempoHastaSilbido = esInicio ? 2100 : 800;

    setTimeout(iniciarRonda, tiempoHastaSilbido);
}

function iniciarRonda() {
    if (!jugando || pausado) return;

    displayEstado.innerText = "¡Sigue el silbido!";
    displayNivel.innerText = `${nivelActual + 1}/5`;

    const config = NIVELES[nivelActual];
    const palabras = PALABRAS[document.getElementById("secuencia").value];

    const realizarSalto = () => {
        cells.forEach(c => c.classList.remove("active"));

        if (posActual < 8) {
            cells[posActual].classList.add("active");
            wordDisplay.innerText = palabras[patronActual[posActual]];
            posActual++;
        } else {
            clearInterval(timerBeat);
            nivelActual++;
            prepararRonda();
        }
    };

    realizarSalto(); // Empieza justo con el silbido
    timerBeat = setInterval(realizarSalto, config.vel);
}

function pausarJuego() {
    if (!jugando || pausado) return;
    pausado = true;
    clearInterval(timerBeat);
    miCronometro.stop();
    musica.pause();
    displayEstado.innerText = "Pausado";
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
    displayEstado.innerText = "Finalizado";
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