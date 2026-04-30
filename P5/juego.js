const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stateEl = document.getElementById("state");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- ESTADO DEL JUEGO ---
let gameState = "MENU"; // MENU, COUNTDOWN, PLAYING, END
let gameMode = ""; // "3goals" o "golden"
let score = { player: 0, bot: 0 };
let countdownValue = 3;
let keys = {};

// --- ENTIDADES ---
const player = {
    x: 150,
    y: HEIGHT / 2,
    radius: 22,
    color: "#2d7ff9",
    speed: 4,
    angle: 0 // Para orientar el disparo
};

const bot = {
    x: WIDTH - 150,
    y: HEIGHT / 2,
    radius: 22,
    color: "#f92d2d",
    speed: 3
};

const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: 12,
    vx: 0,
    vy: 0,
    friction: 0.98
};

const powerShot = {
    charging: false,
    power: 0,
    minPower: 5,
    maxPower: 18,
    chargeSpeed: 0.2
};

// --- CONTROLES ---
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") startPowerShot();
    if (e.key.toLowerCase() === "r") resetGame();
});
window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "Space") releasePowerShot();
});

// --- LÓGICA DE MODOS Y MENÚ ---
function selectMode(mode) {
    gameMode = mode;
    score = { player: 0, bot: 0 };
    startMatch();
}

// Inyectar botones de menú si el estado es MENU
function drawMenu() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BOT LEAGUE", WIDTH / 2, HEIGHT / 2 - 100);
    ctx.font = "20px Arial";
    ctx.fillText("Pulsa '1' para 3 Goles | Pulsa '2' para Gol de Oro", WIDTH / 2, HEIGHT / 2);
    
    if (keys["Digit1"]) selectMode("3goals");
    if (keys["Digit2"]) selectMode("golden");
}

function startMatch() {
    resetPositions();
    gameState = "COUNTDOWN";
    countdownValue = 3;
    let timer = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(timer);
            gameState = "PLAYING";
        }
    }, 1000);
}

function resetPositions() {
    player.x = 150; player.y = HEIGHT / 2;
    bot.x = WIDTH - 150; bot.y = HEIGHT / 2;
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2;
    ball.vx = 0; ball.vy = 0;
    powerShot.charging = false;
}

// --- MECÁNICAS ---
function update() {
    if (gameState !== "PLAYING") return;

    // Movimiento Jugador
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;

    // Orientación (A/D)
    if (keys["KeyA"]) player.angle -= 0.05;
    if (keys["KeyD"]) player.angle += 0.05;

    // IA del Bot con "error humano"
    const dx = ball.x - bot.x;
    const dy = ball.y - bot.y;
    if (Math.abs(dx) > 10) bot.x += Math.sign(dx) * bot.speed;
    if (Math.abs(dy) > 10) bot.y += Math.sign(dy) * bot.speed;

    // Aplicamos los límites a ambos personajes para que no se salgan
    keepInside(player);
    keepInside(bot);

    // Colisiones Pelota con Personajes
    checkCollision(player);
    checkCollision(bot);

    updateBall();
    updatePowerShot();
    checkGoal();
}

function keepInside(obj) {
    // Limitar X
    if (obj.x - obj.radius < 0) obj.x = obj.radius;
    if (obj.x + obj.radius > WIDTH) obj.x = WIDTH - obj.radius;
    
    // Limitar Y
    if (obj.y - obj.radius < 0) obj.y = obj.radius;
    if (obj.y + obj.radius > HEIGHT) obj.y = HEIGHT - obj.radius;
}


function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let distance = Math.hypot(dx, dy);
    let minDistance = obj.radius + ball.radius;

    if (distance < minDistance) {
        let angle = Math.atan2(dy, dx);
        
        // Empujoncito suave al tocarla
        let push = (obj === player) ? 3 : 2; 
        ball.vx += Math.cos(angle) * push;
        ball.vy += Math.sin(angle) * push;

        // Corregir posición para que no se "fusionen"
        let overlap = minDistance - distance;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
    }
}

function updateBall() {
    // 1. Movimiento básico e inercia
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 2. Fricción constante (hace que se pare poco a poco)
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    // 3. Rebotes en bordes laterales (Eje X)
    // Si la pelota NO está en el hueco de la portería (y < 180 o y > 340)
    if (ball.y < 180 || ball.y > 340) {
        if (ball.x - ball.radius < 0) { // Pared izquierda
            ball.x = ball.radius;
            ball.vx *= -0.5; // Rebote suave (pierde la mitad de fuerza)
        }
        if (ball.x + ball.radius > WIDTH) { // Pared derecha
            ball.x = WIDTH - ball.radius;
            ball.vx *= -0.5;
        }
    }

    // 4. Rebotes en bordes superior e inferior (Eje Y)
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -0.5;
    }
    if (ball.y + ball.radius > HEIGHT) {
        ball.y = HEIGHT - ball.radius;
        ball.vy *= -0.5;
    }
}

function checkGoal() {
    if (ball.y > 180 && ball.y < 340) {
        if (ball.x < 0) scorePoint("bot");
        if (ball.x > WIDTH) scorePoint("player");
    }
}

function scorePoint(winner) {
    score[winner]++;
    stateEl.textContent = winner === "player" ? "¡GOOOL!" : "¡GOL DEL RIVAL!";
    
    if (gameMode === "golden" || (gameMode === "3goals" && score[winner] >= 3)) {
        gameState = "END";
    } else {
        gameState = "COUNTDOWN";
        setTimeout(startMatch, 2000);
    }
}

// --- POWER SHOT ---
function startPowerShot() {
    if (gameState === "PLAYING") powerShot.charging = true;
}

function updatePowerShot() {
    if (powerShot.charging) {
        powerShot.power = Math.min(powerShot.power + powerShot.chargeSpeed, powerShot.maxPower);
    }
}


function releasePowerShot() {
    if (!powerShot.charging) return;

    let d = Math.hypot(ball.x - player.x, ball.y - player.y);
    
    // Aumentamos el margen de disparo (player.radius + ball.radius + 30)
    if (d < player.radius + ball.radius + 30) {
        // El chute ahora es mucho más potente que el simple toque
        ball.vx = Math.cos(player.angle) * powerShot.power;
        ball.vy = Math.sin(player.angle) * powerShot.power;
        
        stateEl.textContent = "¡DISPARO POTENTE!";
    } else {
        stateEl.textContent = "Demasiado lejos para chutar";
    }

    powerShot.charging = false;
    powerShot.power = 0;
}

// --- DIBUJO ---
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground();
    
    // Porterías
    ctx.fillStyle = "white";
    ctx.fillRect(0, 180, 5, 160);
    ctx.fillRect(WIDTH - 5, 180, 5, 160);

    drawBall();
    drawEntity(player);
    drawEntity(bot);
    drawUI();

    if (gameState === "MENU") drawMenu();
    if (gameState === "COUNTDOWN") {
        ctx.fillStyle = "white";
        ctx.font = "80px Arial";
        ctx.fillText(countdownValue, WIDTH / 2, HEIGHT / 2);
    }
    if (gameState === "END") {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0,0,WIDTH,HEIGHT);
        ctx.fillStyle = "white";
        ctx.fillText("PARTIDA FINALIZADA", WIDTH/2, HEIGHT/2);
        ctx.font = "20px Arial";
        ctx.fillText("Pulsa R para reiniciar", WIDTH/2, HEIGHT/2 + 50);
    }
}

function drawBackground() {
    ctx.fillStyle = "#2c8f4a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0); ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
}

function drawEntity(obj) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.stroke();
    
    if (obj === player) {
        // Flecha de dirección
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x + Math.cos(player.angle) * 40, obj.y + Math.sin(player.angle) * 40);
        ctx.stroke();
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.stroke();
}

function drawUI() {
    stateEl.textContent = `Marcador: ${score.player} - ${score.bot} | Modo: ${gameMode}`;
    if (powerShot.charging) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(player.x - 25, player.y - 40, powerShot.power * 3, 5);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function resetGame() { location.reload(); }

loop();
