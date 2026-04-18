// Configuración de niveles (Velocidad en ms y patrones)
const NIVELES = [
    { vel: 1200, pattern: [0, 0, 0, 0, 1, 1, 1, 1] },
    { vel: 900,  pattern: [0, 1, 0, 1, 0, 1, 0, 1] },
    { vel: 700,  pattern: [1, 1, 0, 0, 1, 1, 0, 0] },
    { vel: 500,  pattern: [0, 0, 1, 1, 0, 1, 0, 1] },
    { vel: 350,  pattern: [1, 0, 1, 0, 1, 1, 0, 0] }
];

// Datos de palabras (Puedes expandir esto)
const PALABRAS = {
    "cama-casa": ["CAMA", "CASA"],
    "pato-gato": ["PATO", "GATO"],
    "luna-cuna": ["LUNA", "CUNA"]
};

// Estado del juego
let nivelActual = 0;
let posActual = 0;
let timerPartida = null;
let cronometro = null;
let tiempoTranscurrido = 0;
let musicaLoop = new Audio('musica_fondo.mp3'); // Asegúrate de tener este archivo
musicaLoop.loop = true;

// Elementos DOM
const cells = document.querySelectorAll('.cell');
const displayNivel = document.getElementById('display-nivel');
const displayTiempo = document.getElementById('display-tiempo');
const displayEstado = document.getElementById('display-estado');
const wordDisplay = document.getElementById('word-display');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnAudio = document.getElementById('btn-audio');

// --- FUNCIONES ---

function iniciarJuego() {
    nivelActual = parseInt(document.getElementById('nivel-inicial').value);
    bloquearControles(true);
    tiempoTranscurrido = 0;
    actualizarCronometro();
    
    prepararRonda();
}

function prepararRonda() {
    if (nivelActual > 4) {
        finalizarPartida("¡HAS COMPLETADO EL JUEGO!");
        return;
    }

    displayEstado.innerText = "Preparando...";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;
    
    // Pausa de 2 segundos entre rondas
    setTimeout(() => {
        iniciarRonda();
    }, 2000);
}

function iniciarRonda() {
    displayEstado.innerText = "Jugando";
    displayNivel.innerText = `${nivelActual + 1}/5`;
    posActual = 0;
    
    const configuracion = NIVELES[nivelActual];
    const secuenciaSeleccionada = document.getElementById('secuencia').value;
    const palabras = PALABRAS[secuenciaSeleccionada];

    timerPartida = setInterval(() => {
        // Limpiar anterior
        cells.forEach(c => c.classList.remove('active'));
        
        if (posActual < 8) {
            // Activar celda actual
            const tipoPalabra = configuracion.pattern[posActual];
            cells[posActual].classList.add('active');
            cells[posActual].innerText = palabras[tipoPalabra]; // Opcional: poner texto en la celda
            wordDisplay.innerText = palabras[tipoPalabra];
            
            posActual++;
        } else {
            // Ronda terminada
            clearInterval(timerPartida);
            nivelActual++;
            prepararRonda();
        }
    }, configuracion.vel);

    if (!cronometro) {
        cronometro = setInterval(() => {
            tiempoTranscurrido += 0.1;
            displayTiempo.innerText = tiempoTranscurrido.toFixed(1) + "s";
        }, 100);
    }
}

function detenerJuego() {
    clearInterval(timerPartida);
    clearInterval(cronometro);
    cronometro = null;
    musicaLoop.pause();
    musicaLoop.currentTime = 0;
    
    cells.forEach(c => {
        c.classList.remove('active');
        c.innerText = "";
    });
    
    wordDisplay.innerText = "Partida detenida";
    displayEstado.innerText = "En espera";
    bloquearControles(false);
}

function finalizarPartida(mensaje) {
    detenerJuego();
    wordDisplay.innerText = mensaje;
}

function bloquearControles(bloquear) {
    document.getElementById('secuencia').disabled = bloquear;
    document.getElementById('nivel-inicial').disabled = bloquear;
    btnStart.disabled = bloquear;
}

// --- EVENTOS ---

btnStart.addEventListener('click', () => {
    iniciarJuego();
    if (btnAudio.innerText.includes("ON")) musicaLoop.play();
});

btnStop.addEventListener('click', detenerJuego);

btnAudio.addEventListener('click', () => {
    if (musicaLoop.paused) {
        btnAudio.innerText = "Música: ON";
        if (displayEstado.innerText === "Jugando") musicaLoop.play();
    } else {
        btnAudio.innerText = "Música: OFF";
        musicaLoop.pause();
    }
});