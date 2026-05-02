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
let goalMessage = ""; // Para mostrar "¡GOOOL!"
let keys = {};

// --- ENTIDADES ---
const player = { x: 150, y: HEIGHT / 2, radius: 18, color: "#2d7ff9", speed: 4, angle: 0 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: 0, vy: 0, friction: 0.98 };

// Lista de Bots (1 aliado, 2 enemigos)
const bots = [
    { x: 100, y: 100, radius: 18, color: "#4fc3f7", speed: 2.5, team: "player", role: "defensa" },
    { x: 650, y: 150, radius: 18, color: "#f92d2d", speed: 2.7, team: "bot", role: "agresivo" },
    { x: 650, y: 350, radius: 18, color: "#f92d2d", speed: 2.2, team: "bot", role: "defensa" }
];

const powerShot = { charging: false, power: 0, maxPower: 15 };

// --- INPUTS ---
window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (e.code === "Space" && gameState === "PLAYING") powerShot.charging = true;
    if (e.key.toLowerCase() === "r") resetMatch();
    if (e.key.toLowerCase() === "m") backToMenu();
});
window.addEventListener("keyup", e => {
    keys[e.code] = false;
    if (e.code === "Space") releasePowerShot();
});

// --- MODOS Y ESTADOS ---
function selectMode(mode) {
    gameMode = mode;
    score = { player: 0, bot: 0 };
    overlay.classList.add("hidden");
    startCountdown();
}

function startCountdown() {
    gameState = "COUNTDOWN";
    countdownValue = 3;
    resetPositions();
    let timer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(timer);
            gameState = "PLAYING";
            goalMessage = "";
        }
    }, 800);
}

function resetPositions() {
    player.x = 180; player.y = HEIGHT / 2;
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2;
    ball.vx = 0; ball.vy = 0;
    bots[0].x = 100; bots[0].y = HEIGHT/2; // Compañero
    bots[1].x = 600; bots[1].y = 150;      // Rival 1
    bots[2].x = 650; bots[2].y = 350;      // Rival 2
}

function backToMenu() {
    gameState = "MENU";
    overlay.classList.remove("hidden");
    menuContent.innerHTML = `
        <h2>Elige modo de juego</h2>
        <button onclick="selectMode('3goals')">Partido a 3 goles</button>
        <button onclick="selectMode('golden')">Gol de Oro</button>
        <p class="controls-hint">Mover: Flechas | Girar: A/D | Chutar: Espacio</p>`;
}

// --- LÓGICA ---
function update() {
    if (gameState !== "PLAYING") return;

    // Movimiento Jugador
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["KeyA"]) player.angle -= 0.05;
    if (keys["KeyD"]) player.angle += 0.05;
    
    keepInside(player);

    // Lógica de Bots
    bots.forEach(b => {
        let targetX, targetY;
        if (b.role === "agresivo") {
            targetX = ball.x; targetY = ball.y;
        } else {
            // Defensas se quedan entre la pelota y su portería
            let goalX = (b.team === "player") ? 0 : WIDTH;
            targetX = (ball.x + goalX) / 2;
            targetY = (ball.y + HEIGHT/2) / 2;
        }
        
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

    // Balón
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    // Rebotes y Goles
    if (ball.y < 180 || ball.y > 320) { // Paredes
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > WIDTH) ball.vx *= -0.8;
    } else { // Área de portería
        if (ball.x < -ball.radius) scorePoint("player");
        if (ball.x > WIDTH + ball.radius) scorePoint("bot");
    }
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > HEIGHT) ball.vy *= -0.8;

    checkCollision(player);
}

function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let dist = Math.hypot(dx, dy);
    if (dist < obj.radius + ball.radius) {
        let angle = Math.atan2(dy, dx);
        let force = 4;
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
    }
}

function releasePowerShot() {
    if (!powerShot.charging) return;
    let dist = Math.hypot(ball.x - player.x, ball.y - player.y);
    if (dist < player.radius + ball.radius + 20) {
        ball.vx = Math.cos(player.angle) * powerShot.power;
        ball.vy = Math.sin(player.angle) * powerShot.power;
    }
    powerShot.charging = false;
    powerShot.power = 0;
}

function scorePoint(who) {
    if (who === "player") { score.player++; goalMessage = "¡GOOOL!"; }
    else { score.bot++; goalMessage = "¡GOL RIVAL!"; }

    if ((gameMode === "golden") || (gameMode === "3goals" && (score.player >= 3 || score.bot >= 3))) {
        gameState = "END";
    } else {
        startCountdown();
    }
}

function keepInside(obj) {
    obj.x = Math.max(obj.radius, Math.min(WIDTH - obj.radius, obj.x));
    obj.y = Math.max(obj.radius, Math.min(HEIGHT - obj.radius, obj.y));
}

// --- DIBUJO ---
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Campo decorativo
    ctx.strokeStyle = "white"; ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, WIDTH-20, HEIGHT-20);
    ctx.beginPath(); ctx.moveTo(WIDTH/2, 10); ctx.lineTo(WIDTH/2, HEIGHT-10); ctx.stroke();
    ctx.beginPath(); ctx.arc(WIDTH/2, HEIGHT/2, 50, 0, Math.PI*2); ctx.stroke();

    // Porterías
    ctx.fillStyle = "#aaa";
    ctx.fillRect(0, 180, 10, 140);
    ctx.fillRect(WIDTH-10, 180, 10, 140);

    // Pelota
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "white"; ctx.fill(); ctx.stroke();

    // Jugadores y Bots
    [player, ...bots].forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
        ctx.fillStyle = b.color; ctx.fill(); ctx.stroke();
        if (b === player) {
            ctx.beginPath(); ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle)*30, b.y + Math.sin(b.angle)*30);
            ctx.stroke();
        }
    });

    // UI
    stateEl.textContent = `Marcador: ${score.player} - ${score.bot} | Modo: ${gameMode}`;
    
    if (gameState === "COUNTDOWN") {
        ctx.fillStyle = "white"; ctx.font = "bold 60px Arial"; ctx.textAlign = "center";
        ctx.fillText(goalMessage, WIDTH/2, HEIGHT/2 - 50);
        ctx.fillText(countdownValue, WIDTH/2, HEIGHT/2 + 50);
    }

    if (gameState === "END") {
        overlay.classList.remove("hidden");
        menuContent.innerHTML = `
            <h2>${score.player > score.bot ? "¡HAS GANADO!" : "DERROTA..."}</h2>
            <p>Resultado final: ${score.player} - ${score.bot}</p>
            <button onclick="backToMenu()">Volver al Menú</button>
            <p class="controls-hint">Pulsa R para reiniciar rápido</p>`;
    }

    if (powerShot.charging) {
        powerShot.power = Math.min(powerShot.power + 0.3, powerShot.maxPower);
        ctx.fillStyle = "yellow"; ctx.fillRect(player.x - 20, player.y - 30, powerShot.power * 2.6, 5);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();