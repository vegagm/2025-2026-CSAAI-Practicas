// ================= CONFIGURACIÓN =================
const NIVELES = [
    { vel: 600 }, // Nivel 1
    { vel: 500 }, // Nivel 2
    { vel: 400 }, // Nivel 3
    { vel: 300 }, // Nivel 4
    { vel: 200 }  // Nivel 5
];

const PALABRAS = {
    "cama-casa": [
        { texto: "CAMA", icono: "🛏️" },
        { texto: "CASA", icono: "🏠" }
    ],
    "pato-gato": [
        { texto: "PATO", icono: "🦆" },
        { texto: "GATO", icono: "🐈" }
    ],
    "luna-cuna": [
        { texto: "LUNA", icono: "🌙" },
        { texto: "CUNA", icono: "👶" }
    ],
    "queso-beso": [
        { texto: "QUESO", icono: "🧀" },
        { texto: "BESO", icono: "💋" }
    ]
};

// ================= ESTADO DEL JUEGO =================
let nivelActual = 0;
let posActual = 0;
let jugando = false;
let pausado = false;
let timerBeat = null;
let musicaActiva = false;
let patronActual = [];

// Audio de fondo genérico
// let musica = new Audio("musicafondo2.m4a");
let musica = new Audio("cancion2.mp3");
musica.loop = true;

const cells = document.querySelectorAll(".cell");
const wordDisplay = document.getElementById("word-display");
const btnStart = document.getElementById("btn-start");
const btnPause = document.getElementById("btn-pause");
const btnResume = document.getElementById("btn-resume");
const btnAudio = document.getElementById("btn-audio");
const displayNivel = document.getElementById("display-nivel");
const displayEstado = document.getElementById("display-estado");

const miCronometro = new Cronometro(document.getElementById("display-tiempo"));

// ================= FUNCIONES =================

function generarPatronEquilibrado() {
    let lista = [0, 0, 0, 0, 1, 1, 1, 1];
    for (let i = lista.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
}

function dibujarTableroEstatico() {
    const seleccion = document.getElementById("secuencia").value;
    const parejaSeleccionada = PALABRAS[seleccion];
    
    cells.forEach((cell, index) => {
        cell.classList.remove("active");
        let tipo = patronActual[index];
        const info = parejaSeleccionada[tipo];

        cell.innerHTML = `
            <div class="cell-icon">${info.icono}</div>
            <div class="cell-text">${info.texto}</div>
        `;
    });
}

function iniciarJuego() {
    clearInterval(timerBeat);
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

    patronActual = generarPatronEquilibrado();
    posActual = 0; 
    dibujarTableroEstatico(); 
    
    displayEstado.innerText = "¡Prepárate!";
    wordDisplay.innerText = `Nivel ${nivelActual + 1}`;

    setTimeout(iniciarRonda, 1000);
}

function iniciarRonda() {
    if (!jugando || pausado) return;

    displayEstado.innerText = "¡Sigue el ritmo!";
    displayNivel.innerText = `${nivelActual + 1}/5`;

    wordDisplay.innerHTML = "&nbsp;";

    const config = NIVELES[nivelActual];
    // const seleccion = document.getElementById("secuencia").value;
    // const parejaSeleccionada = PALABRAS[seleccion];

    const realizarSalto = () => {
        // Quitar resaltado de todas las celdas
        cells.forEach(c => c.classList.remove("active"));

        if (posActual < 8) {
            cells[posActual].classList.add("active");
            
            // Mostrar la palabra correspondiente en el display superior
            // let tipo = patronActual[posActual];
            // const info = parejaSeleccionada[tipo];
            // wordDisplay.innerText = `${info.icono} ${info.texto}`;

            posActual++;
        } else {
            // Fin de la secuencia de 8
            clearInterval(timerBeat);
            nivelActual++;
            setTimeout(prepararRonda, 500);
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
    displayEstado.innerText = "Pausado";
    btnPause.classList.add("hidden");
    btnResume.classList.remove("hidden");
}

function reanudarJuego() {
    if (!pausado) return;
    pausado = false;
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