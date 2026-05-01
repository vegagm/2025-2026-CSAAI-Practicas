const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const stateEl = document.getElementById("state");
const overlay = document.getElementById("overlay");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- ESTADO ---
let gameState = "MENU";
let gameMode = ""; 
let score = { player: 0, bot: 0 };
let countdownValue = 3;
let keys = {};

// --- ENTIDADES ---
const player = { x: 150, y: HEIGHT / 2, radius: 20, color: "#2d7ff9", speed: 4, angle: 0 };
const bot = { x: WIDTH - 150, y: HEIGHT / 2, radius: 20, color: "#f92d2d", speed: 2.8 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: 0, vy: 0, friction: 0.98 };

const powerShot = { charging: false, power: 0, minPower: 5, maxPower: 16, chargeSpeed: 0.2 };

// --- CONTROLES ---
window.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (e.code === "Space") powerShot.charging = true;
    if (e.key.toLowerCase() === "r") location.reload();
});
window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "Space") releasePowerShot();
});

// --- LÓGICA DE PARTIDA ---
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
        }
    }, 800);
}

function resetPositions() {
    player.x = 150; player.y = HEIGHT / 2;
    bot.x = WIDTH - 150; bot.y = HEIGHT / 2;
    ball.x = WIDTH / 2; ball.y = HEIGHT / 2;
    ball.vx = 0; ball.vy = 0;
    powerShot.charging = false;
}

function keepInside(obj) {
    if (obj.x - obj.radius < 0) obj.x = obj.radius;
    if (obj.x + obj.radius > WIDTH) obj.x = WIDTH - obj.radius;
    if (obj.y - obj.radius < 0) obj.y = obj.radius;
    if (obj.y + obj.radius > HEIGHT) obj.y = HEIGHT - obj.radius;
}

// --- MEJORA DE COLISIÓN (Prioridad al Jugador) ---
function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let distance = Math.hypot(dx, dy);
    
    // El jugador tiene un "aura" un poco más grande para facilitar el control
    let reach = (obj === player) ? obj.radius + ball.radius + 2 : obj.radius + ball.radius;

    if (distance < reach) {
        let angle = Math.atan2(dy, dx);
        
        // El jugador empuja con más decisión (fuerza 5) que el bot (fuerza 3)
        let force = (obj === player) ? 5 : 3; 
        
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;

        // Reposicionamiento para evitar que la pelota se quede "dentro" del cuerpo
        let overlap = reach - distance;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
    }
}

// --- MEJORA DEL BOT (Ataque a portería) ---
function updateBot() {
    const dxBall = ball.x - bot.x;
    const dyBall = ball.y - bot.y;
    const distToBall = Math.hypot(dxBall, dyBall);

    // Si la pelota está lejos, va a por ella
    if (distToBall > 30) {
        bot.x += Math.sign(dxBall) * bot.speed;
        bot.y += Math.sign(dyBall) * bot.speed;
    } else {
        // Si está cerca de la pelota, intenta empujarla HACIA TU PORTERÍA (x: 0, y: 250)
        const dxGoal = 0 - bot.x;
        const dyGoal = HEIGHT / 2 - bot.y;
        bot.x += Math.sign(dxGoal) * bot.speed;
        bot.y += Math.sign(dyGoal) * bot.speed;
    }
}

// --- MEJORA DE LA PELOTA (Rebotes con vidilla) ---
function updateBall() {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Fricción: 0.98 es ideal para que no se pare de golpe ni ruede infinito
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;

    // Rebotes laterales (excepto zona de portería)
    if (ball.y < 180 || ball.y > 320) {
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -0.6; // Rebota y pierde algo de fuerza
        }
        if (ball.x + ball.radius > WIDTH) {
            ball.x = WIDTH - ball.radius;
            ball.vx *= -0.6;
        }
    }

    // Rebotes superior e inferior
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -0.6;
    }
    if (ball.y + ball.radius > HEIGHT) {
        ball.y = HEIGHT - ball.radius;
        ball.vy *= -0.6;
    }
}


function update() {
    if (gameState !== "PLAYING") return;

    // Movimiento Jugador
    if (keys["ArrowUp"]) player.y -= player.speed;
    if (keys["ArrowDown"]) player.y += player.speed;
    if (keys["ArrowLeft"]) player.x -= player.speed;
    if (keys["ArrowRight"]) player.x += player.speed;
    if (keys["KeyA"]) player.angle -= 0.05;
    if (keys["KeyD"]) player.angle += 0.05;

    // Nueva lógica del Bot
    updateBot();

    // Mantener dentro
    keepInside(player);
    keepInside(bot);

    // Físicas
    updateBall();
    checkCollision(player);
    checkCollision(bot);
    checkGoal();

    if (powerShot.charging) {
        powerShot.power = Math.min(powerShot.power + powerShot.chargeSpeed, powerShot.maxPower);
    }
}

function releasePowerShot() {
    if (!powerShot.charging) return;
    let d = Math.hypot(ball.x - player.x, ball.y - player.y);
    if (d < player.radius + ball.radius + 35) {
        ball.vx = Math.cos(player.angle) * powerShot.power;
        ball.vy = Math.sin(player.angle) * powerShot.power;
    }
    powerShot.charging = false;
    powerShot.power = 0;
}

function checkGoal() {
    if (ball.y > 180 && ball.y < 320) {
        if (ball.x < 0) scorePoint("bot");
        else if (ball.x > WIDTH) scorePoint("player");
    }
}

function scorePoint(winner) {
    score[winner]++;
    if (gameMode === "golden" || (gameMode === "3goals" && score[winner] >= 3)) {
        gameState = "END";
    } else {
        startCountdown();
    }
}

// --- DIBUJO ---
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // Campo
    ctx.fillStyle = "#2c8f4a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, WIDTH, HEIGHT);
    ctx.beginPath();
    ctx.moveTo(WIDTH/2, 0); ctx.lineTo(WIDTH/2, HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(WIDTH/2, HEIGHT/2, 70, 0, Math.PI*2);
    ctx.stroke();

    // Porterías
    ctx.fillStyle = "white";
    ctx.fillRect(0, 180, 5, 140);
    ctx.fillRect(WIDTH - 5, 180, 5, 140);

    // Pelota
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "white"; ctx.fill(); ctx.stroke();

    // Jugadores
    [player, bot].forEach(obj => {
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI*2);
        ctx.fillStyle = obj.color; ctx.fill(); ctx.stroke();
        if(obj === player) {
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y);
            ctx.lineTo(obj.x + Math.cos(obj.angle)*35, obj.y + Math.sin(obj.angle)*35);
            ctx.stroke();
        }
    });

    // UI
    stateEl.textContent = `Marcador: ${score.player} - ${score.bot} | Modo: ${gameMode || "---"}`;
    if (gameState === "COUNTDOWN") {
        ctx.fillStyle = "white"; ctx.font = "bold 80px Arial"; ctx.textAlign = "center";
        ctx.fillText(countdownValue, WIDTH/2, HEIGHT/2);
    }
    if (gameState === "END") {
        overlay.classList.remove("hidden");
        document.getElementById("menu").innerHTML = `<h2>${score.player > score.bot ? "¡VICTORIA!" : "DERROTA..."}</h2><button onclick="location.reload()">Reiniciar</button>`;
    }
    if (powerShot.charging) {
        ctx.fillStyle = "yellow";
        ctx.fillRect(player.x - 20, player.y - 35, powerShot.power * 2.5, 6);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();