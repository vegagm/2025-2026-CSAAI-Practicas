const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stateEl = document.getElementById("state");
const overlay = document.getElementById("overlay");
const menuContent = document.getElementById("menu-content");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let gameState = "MENU";
let gameMode = ""; 
let score = { player: 0, bot: 0 };
let countdownValue = 0;
let goalMessage = "";
let keys = {};

// --- SONIDOS Y MÚSICA ---
const kickSound = new Audio("pelota.m4a");
const goalSound = new Audio("gol.m4a");

const tracks = [
    { name: "Canción 1", file: "musica1.m4a" },
    { name: "Canción 2", file: "musica2.m4a" },
    { name: "Canción 3", file: "musica3.m4a" },
    { name: "Canción 4", file: "musica4.m4a" }
];

let currentTrackIndex = 0;
let bgMusic = new Audio(tracks[currentTrackIndex].file);
bgMusic.loop = true;
bgMusic.volume = 0.5;
let isMuted = false;

// --- ENTIDADES ---
const player = { x: 200, y: HEIGHT / 2, radius: 18, color: "#2d7ff9", speed: 4.5, angle: 0 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: 0, vy: 0, friction: 0.98, color: "white" };

const bots = [
    { x: 100, y: HEIGHT/2, radius: 18, color: "#4fc3f7", speed: 3.0, team: "player", role: "portero" },
    { x: 700, y: HEIGHT/2, radius: 18, color: "#f92d2d", speed: 3.2, team: "bot", role: "portero" },
    { x: 600, y: 150, radius: 18, color: "#f92d2d", speed: 3.5, team: "bot", role: "delantero" }
];

const powerShot = { charging: false, power: 0, maxPower: 16 };

// --- LÓGICA DE MENÚ Y MÚSICA ---
function renderMenu() {
    menuContent.innerHTML = `
        <h2>Bot League Arcade</h2>
        <button onclick="selectMode('3goals')">Partido a 3 goles</button>
        <button onclick="selectMode('golden')">Gol de Oro</button>
        <h3>🎵 Música</h3>
        <div>
            ${tracks.map((t, i) => `
                <button onclick="changeTrack(${i})"
                    style="background:${i === currentTrackIndex ? '#4caf50' : '#444'}; padding: 8px 15px; font-size: 0.9rem;">
                    ${t.name}
                </button>
            `).join("")}
        </div>
        <button onclick="toggleMusic()" style="position:absolute; top:15px; right:15px; border-radius:50%; width:50px; height:50px;">
            ${isMuted ? "🔇" : "🔊"}
        </button>
        <p class="controls-hint">Flechas: Mover | A/D: Girar | Espacio: Chutar</p>
    `;
}

function changeTrack(index) {
    bgMusic.pause();
    currentTrackIndex = index;
    bgMusic = new Audio(tracks[index].file);
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    if (!isMuted) bgMusic.play();
    renderMenu();
}

function toggleMusic() {
    isMuted = !isMuted;
    isMuted ? bgMusic.pause() : bgMusic.play();
    renderMenu();
}

function selectMode(mode) {
    gameMode = mode;
    score.player = 0; score.bot = 0;
    overlay.classList.add("hidden");
    if (!isMuted) bgMusic.play();
    startCountdown();
}

function startCountdown() {
    gameState = "COUNTDOWN";
    countdownValue = 3;
    resetPositions();
    const timer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(timer);
            gameState = "PLAYING";
        }
    }, 1000);
}

function resetPositions() {
    player.x = 200; player.y = HEIGHT / 2;
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2;
    ball.vx = 0; ball.vy = 0;
    bots[0].x = 80; bots[0].y = HEIGHT/2;
    bots[1].x = WIDTH - 80; bots[1].y = HEIGHT/2;
    bots[2].x = WIDTH - 200; bots[2].y = HEIGHT/3;
}

// --- FÍSICA Y ACTUALIZACIÓN ---
function update() {
    if (gameState !== "PLAYING") return;

    // Movimiento Jugador
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["KeyA"]) player.angle -= 0.07;
    if (keys["KeyD"]) player.angle += 0.07;
    keepInside(player);

    // Bots (IA mejorada para evitar colisiones infinitas)
    bots.forEach(b => {
        let dx = ball.x - b.x;
        let dy = ball.y - b.y;
        let dist = Math.hypot(dx, dy);
        if (dist > 10) {
            b.x += (dx / dist) * b.speed;
            b.y += (dy / dist) * b.speed;
        }
        checkCollision(b);
        keepInside(b);
    });

    // Balón
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    handleWallBounces(); 
    checkCollision(player);
}

function handleWallBounces() {
    const bounce = -0.7;
    // Rebotes Laterales (Líneas de fondo)
    if (ball.x - ball.radius < 20 || ball.x + ball.radius > WIDTH - 20) {
        // Si está en el rango de la portería
        if (ball.y > 180 && ball.y < 320) {
            if (ball.x < 0) scorePoint("bot");
            else if (ball.x > WIDTH) scorePoint("player");
        } else {
            // Rebote en pared de fondo
            if (ball.x - ball.radius < 20) { ball.x = 20 + ball.radius; ball.vx *= bounce; }
            if (ball.x + ball.radius > WIDTH - 20) { ball.x = WIDTH - 20 - ball.radius; ball.vx *= bounce; }
        }
    }
    // Rebotes Techo/Suelo
    if (ball.y - ball.radius < 20) { ball.y = 20 + ball.radius; ball.vy *= bounce; }
    if (ball.y + ball.radius > HEIGHT - 20) { ball.y = HEIGHT - 20 - ball.radius; ball.vy *= bounce; }
}

function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let dist = Math.hypot(dx, dy);
    if (dist < obj.radius + ball.radius) {
        let angle = Math.atan2(dy, dx);
        let force = 6; 
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
        kickSound.currentTime = 0;
        kickSound.play();
    }
}

function scorePoint(who) {
    who === "player" ? score.player++ : score.bot++;
    goalSound.play();
    
    if ((gameMode === "golden") || (gameMode === "3goals" && (score.player >= 3 || score.bot >= 3))) {
        showEndScreen();
    } else {
        startCountdown();
    }
}

function showEndScreen() {
    gameState = "END";
    overlay.classList.remove("hidden");
    menuContent.innerHTML = `
        <h2>${score.player > score.bot ? "¡VICTORIA!" : "DERROTA..."}</h2>
        <p style="font-size:2rem">${score.player} - ${score.bot}</p>
        <button onclick="selectMode('${gameMode}')">Revancha</button>
        <button onclick="backToMenu()" style="background:#555">Menú Principal</button>
    `;
}

function backToMenu() {
    gameState = "MENU";
    overlay.classList.remove("hidden");
    renderMenu();
}

function keepInside(obj) {
    obj.x = Math.max(obj.radius + 20, Math.min(WIDTH - obj.radius - 20, obj.x));
    obj.y = Math.max(obj.radius + 20, Math.min(HEIGHT - obj.radius - 20, obj.y));
}

// --- DIBUJO DEL CAMPO REALISTA ---
function drawField() {
    // Césped bitono
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#2c8f4a" : "#247e40";
        ctx.fillRect(i * (WIDTH / 10), 0, WIDTH / 10, HEIGHT);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 3;

    // Líneas exteriores
    ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);

    // Línea de medio campo
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 20);
    ctx.lineTo(WIDTH / 2, HEIGHT - 20);
    ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(WIDTH / 2, HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Áreas
    ctx.strokeRect(20, 120, 80, 260); // Área Izq
    ctx.strokeRect(WIDTH - 100, 120, 80, 260); // Área Der

    // Porterías
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 180, 20, 140);
    ctx.strokeRect(WIDTH - 20, 180, 20, 140);
}

function draw() {
    drawField();

    // Balón (Blanco)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Entidades
    [player, ...bots].forEach(b => {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (b === player) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle) * 30, b.y + Math.sin(b.angle) * 30);
            ctx.stroke();
        }
    });

    // UI Score
    stateEl.innerText = `${score.player} - ${score.bot}`;

    // Overlay de Cuenta Atrás
    if (gameState === "COUNTDOWN") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(0,0,WIDTH,HEIGHT);
        ctx.fillStyle = "white";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText(countdownValue, WIDTH/2, HEIGHT/2 + 30);
    }
}

// --- BUCLE PRINCIPAL ---
window.addEventListener("keydown", e => { keys[e.code] = true; });
window.addEventListener("keyup", e => { keys[e.code] = false; });

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

renderMenu();
loop();