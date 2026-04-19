// ================= CONFIG =================
const NIVELES = [
    { vel: 1200 }, { vel: 900 }, { vel: 700 }, { vel: 500 }, { vel: 350 }
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

// El cronómetro se inicializa después de que el DOM esté listo o al final del archivo
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

// Inicializamos el cronómetro aquí
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
    // Si ya había una partida (aunque estuviera pausada), limpiamos todo
    clearInterval(timerBeat);
    if (miCronometro) miCronometro.stop();
    
    jugando = true;
    pausado = false;
    
    // Leemos los valores actuales (por si el usuario los cambió durante la pausa)
    nivelActual = parseInt(document.getElementById("nivel-inicial").value);

    // Reset visual de los botones: mostramos Pausa y ocultamos Reanudar
    btnPause.classList.remove("hidden");
    btnResume.classList.add("hidden");

    bloquearControles(true);
    miCronometro.reset();
    miCronometro.start();

    if (musicaActiva) {
        musica.currentTime = 0; // Reiniciamos la música desde el principio
        musica.play().catch(e => console.log("Error audio:", e));
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

function pausarJuego() {
    if (!jugando || pausado) return;

    pausado = true;
    clearInterval(timerBeat);
    miCronometro.stop();
    musica.pause();

    document.getElementById("display-estado").innerText = "Pausado";
    
    btnPause.classList.add("hidden");
    btnResume.classList.remove("hidden");

    // AHORA: Permitimos cambiar ajustes y reiniciar mientras está en pausa
    bloquearControles(false); 
}

function reanudarJuego() {
    if (!pausado) return;

    pausado = false;
    bloquearControles(true); // Volvemos a bloquear mientras se juega

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
        musica.play().catch(e => console.log("Error audio:", e));
    } else {
        musica.pause();
    }
});