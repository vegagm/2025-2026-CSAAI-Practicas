// ================= CONFIGURACIÓN =================
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

// ================= ESTADO DEL JUEGO =================
let nivelActual = 0;
let posActual = 0;
let jugando = false;
let pausado = false;
let timerBeat = null;
let musicaActiva = false;
let patronActual = [];

// Elementos de Audio y Cronómetro
let musica = new Audio("musicafondo2.m4a");
musica.loop = true;

// Referencias al DOM
const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");
const displayNivel = document.getElementById("display-nivel");
const displayEstado = document.getElementById("display-estado");
const selectNivelInicial = document.getElementById("nivel-inicial");
const selectSecuencia = document.getElementById("secuencia");

// Inicialización del cronómetro (Clase externa en crono.js)
const miCronometro = new Cronometro(document.getElementById("display-tiempo"));

// ================= FUNCIONES LÓGICAS =================

// Genera un patrón de 8 posiciones con 0 o 1 aleatoriamente
function generarPatronAleatorio() {
    let nuevoPatron = [];
    for (let i = 0; i < 8; i++) {
        nuevoPatron.push(Math.round(Math.random())); 
    }
    return nuevoPatron;
}

// Dibuja las palabras en las celdas sin resaltarlas
function dibujarTableroEstatico() {
    const palabras = PALABRAS[selectSecuencia.value];
    cells.forEach((cell, index) => {
        cell.classList.remove("active"); // Limpiar resaltados previos
        let tipo = patronActual[index];
        cell.innerText = palabras[tipo];
    });
}

function iniciarJuego() {
    // Limpieza total antes de empezar
    clearInterval(timerBeat);
    if (miCronometro) miCronometro.stop();
    
    jugando = true;
    pausado = false;
    nivelActual = parseInt(selectNivelInicial.value);

    // Interfaz de botones
    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");

    bloquearControles(true);
    miCronometro.reset();
    miCronometro.start();

    if (musicaActiva) {
        musica.currentTime = 0; 
        musica.play().catch(e => console.warn("Audio en espera de interacción"));
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
    
    displayEstado.innerText = "Preparando...";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    // Lógica de tiempos: 2s al inicio (Nivel 1), 0.6s en las pausas intermedias
    let esInicio = (nivelActual === parseInt(selectNivelInicial.value));
    let tiempoEspera = esInicio ? 2000 : 600;

    setTimeout(iniciarRonda, tiempoEspera);
}

function iniciarRonda() {
    if (!jugando || pausado) return;

    displayEstado.innerText = "Jugando";
    displayNivel.innerText = `${nivelActual + 1}/5`;

    const config = NIVELES[nivelActual];
    const palabras = PALABRAS[selectSecuencia.value];

    const realizarSalto = () => {
        // 1. Quitar el recuadro rojo de todas las celdas
        cells.forEach(c => c.classList.remove("active"));

        if (posActual < 8) {
            // 2. Iluminar la celda actual
            cells[posActual].classList.add("active");
            
            // 3. Actualizar el texto grande central
            let tipo = patronActual[posActual];
            wordDisplay.innerText = palabras[tipo];

            posActual++;
        } else {
            // Fin de la tanda de 8
            clearInterval(timerBeat);
            nivelActual++;
            prepararRonda();
        }
    };

    // Ejecución inmediata del primer beat tras la espera
    realizarSalto();
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
    selectSecuencia.disabled = bloquear;
    selectNivelInicial.disabled = bloquear;
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
        musica.play().catch(e => console.error("Error al reproducir audio"));
    } else {
        musica.pause();
    }
});