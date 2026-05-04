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

// 🔊 SONIDOS
const kickSound = new Audio("pelota.m4a");
const goalSound = new Audio("gol.m4a");

// 🎵 SISTEMA DE MÚSICA (4 CANCIONES)
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

function playMusicFromStart() {
    bgMusic.currentTime = 0;
    if (!isMuted) bgMusic.play();
}

function changeTrack(index) {
    currentTrackIndex = index;

    bgMusic.pause();
    bgMusic = new Audio(tracks[index].file);
    bgMusic.loop = true;
    bgMusic.volume = 0.5;

    playMusicFromStart();
    renderMenu(); // 🔥 refresca UI
}

function toggleMusic() {
    isMuted = !isMuted;

    if (isMuted) bgMusic.pause();
    else bgMusic.play();

    renderMenu();
}

// 🧩 MENÚ CENTRALIZADO (IMPORTANTE)
function renderMenu() {
    menuContent.innerHTML = `
        <h2>Elige modo de juego</h2>

        <button onclick="selectMode('3goals')">Partido a 3 goles</button>
        <button onclick="selectMode('golden')">Gol de Oro</button>

        <h3>🎵 Música</h3>
        <div>
            ${tracks.map((t, i) => `
                <button onclick="changeTrack(${i})"
                    style="background:${i === currentTrackIndex ? '#4caf50' : '#444'}">
                    ${t.name}
                </button>
            `).join("")}
        </div>

        <button onclick="toggleMusic()" style="
            position:absolute;
            top:15px;
            right:15px;
            font-size:20px;
            padding:10px;
            border-radius:50%;
        ">
            ${isMuted ? "🔇" : "🔊"}
        </button>

        <p class="controls-hint">
            Mover: Flechas | Girar: A/D | Chutar: Espacio<br>
            R: Reiniciar | M: Menú
        </p>
    `;
}

// --- ENTIDADES ---
const player = { x: 200, y: HEIGHT / 2, radius: 18, color: "#2d7ff9", speed: 4.5, angle: 0 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: 0, vy: 0, friction: 0.985 };

const bots = [
    { x: 100, y: HEIGHT/2, radius: 18, color: "#4fc3f7", speed: 3.0, team: "player", role: "portero" },
    { x: 700, y: HEIGHT/2, radius: 18, color: "#f92d2d", speed: 3.2, team: "bot", role: "portero" },
    { x: 600, y: 150, radius: 18, color: "#f92d2d", speed: 3.5, team: "bot", role: "delantero" }
];

const powerShot = { charging: false, power: 0, maxPower: 16 };

// --- INPUTS ---
window.addEventListener("keydown", e => {
    keys[e.code] = true;

    if (e.key.toLowerCase() === 'r') resetMatch();
    if (e.key.toLowerCase() === 'm') backToMenu();

    if (e.code === "Space" && gameState === "PLAYING") powerShot.charging = true;
});

window.addEventListener("keyup", e => {
    keys[e.code] = false;
    if (e.code === "Space") releasePowerShot();
});

// --- MENÚ ---
function selectMode(mode) {
    gameMode = mode;
    score.player = 0;
    score.bot = 0;
    overlay.classList.add("hidden");
    playMusicFromStart();
    startCountdown();
}

function resetMatch() {
    if (gameMode === "") return; 
    score.player = 0;
    score.bot = 0;
    goalMessage = "";
    overlay.classList.add("hidden"); 
    playMusicFromStart();
    startCountdown(); 
}

function backToMenu() {
    gameState = "MENU";
    gameMode = "";
    overlay.classList.remove("hidden");
    playMusicFromStart();
    renderMenu(); // 🔥 USAMOS MENÚ DINÁMICO
}

// --- PARTIDA ---
function startCountdown() {
    gameState = "COUNTDOWN";
    countdownValue = 3;
    resetPositions();

    if (window.timerInterval) clearInterval(window.timerInterval);
    
    window.timerInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(window.timerInterval);
            gameState = "PLAYING";
            goalMessage = "";
        }
    }, 1000);
}

function resetPositions() {
    player.x = 200; player.y = HEIGHT / 2;
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2;
    ball.vx = 0; ball.vy = 0;

    bots.forEach((b, i) => {
        if (i === 0) { b.x = 100; b.y = HEIGHT/2; }
        if (i === 1) { b.x = WIDTH - 100; b.y = HEIGHT/2; }
        if (i === 2) { b.x = WIDTH - 200; b.y = HEIGHT/2; }
    });
}

function update() {
    if (gameState !== "PLAYING") return;

    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["KeyA"]) player.angle -= 0.07;
    if (keys["KeyD"]) player.angle += 0.07;
    keepInside(player);

    bots.forEach(b => {
        let targetX = ball.x;
        let targetY = ball.y;

        let dx = targetX - b.x;
        let dy = targetY - b.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 5) {
            b.x += (dx / dist) * b.speed;
            b.y += (dy / dist) * b.speed;
        }

        checkCollision(b);
        keepInside(b);
    });

    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    handleWallBounces(); 
    checkCollision(player);
}

function handleWallBounces() {
    const bounce = -0.8;

    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= bounce; }
    if (ball.y + ball.radius > HEIGHT) { ball.y = HEIGHT - ball.radius; ball.vy *= bounce; }

    if (ball.y < 180 || ball.y > 320) {
        if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= bounce; }
        if (ball.x + ball.radius > WIDTH) { ball.x = WIDTH - ball.radius; ball.vx *= bounce; }
    } else {
        if (ball.x < -ball.radius) scorePoint("bot");
        else if (ball.x > WIDTH + ball.radius) scorePoint("player");
    }
}

function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let dist = Math.hypot(dx, dy);
    let min = obj.radius + ball.radius;

    if (dist < min) {
        let nx = dx / dist;
        let ny = dy / dist;

        ball.x += nx * 3;
        ball.y += ny * 3;

        let speed = Math.min(Math.hypot(ball.vx, ball.vy) + 4, 12);

        ball.vx = nx * speed;
        ball.vy = ny * speed;

        kickSound.currentTime = 0;
        kickSound.play();
    }
}

function releasePowerShot() {
    if (!powerShot.charging) return;

    let dist = Math.hypot(ball.x - player.x, ball.y - player.y);
    if (dist < player.radius + ball.radius + 20) {
        ball.vx = Math.cos(player.angle) * powerShot.power;
        ball.vy = Math.sin(player.angle) * powerShot.power;

        kickSound.currentTime = 0;
        kickSound.play();
    }

    powerShot.charging = false;
    powerShot.power = 0;
}

function scorePoint(who) {
    if (who === "player") {
        score.player++;
        goalMessage = "¡GOOOL!";
    } else {
        score.bot++;
        goalMessage = "¡GOL RIVAL!";
    }

    goalSound.play();

    const endGolden = gameMode === "golden" && (score.player > 0 || score.bot > 0);
    const end3 = gameMode === "3goals" && (score.player >= 3 || score.bot >= 3);

    if (endGolden || end3) showEndScreen();
    else startCountdown();
}

function showEndScreen() {
    gameState = "END";
    overlay.classList.remove("hidden");

    menuContent.innerHTML = `
        <h2>${score.player > score.bot ? "¡VICTORIA!" : "DERROTA..."}</h2>
        <p>${score.player} - ${score.bot}</p>
        <button onclick="resetMatch()">Reiniciar</button>
        <button onclick="backToMenu()" style="background:#555">Menú</button>
    `;
}

function keepInside(obj) {
    obj.x = Math.max(obj.radius, Math.min(WIDTH - obj.radius, obj.x));
    obj.y = Math.max(obj.radius, Math.min(HEIGHT - obj.radius, obj.y));
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "white";
    ctx.strokeRect(10, 10, WIDTH-20, HEIGHT-20);

    ctx.fillRect(0, 180, 8, 140);
    ctx.fillRect(WIDTH-8, 180, 8, 140);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fill();

    [player, ...bots].forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
        ctx.fillStyle = b.color;
        ctx.fill();

        if (b === player) {
            ctx.beginPath();
            ctx.strokeStyle = "yellow";
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle)*30, b.y + Math.sin(b.angle)*30);
            ctx.stroke();
        }
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
renderMenu();
playMusicFromStart();