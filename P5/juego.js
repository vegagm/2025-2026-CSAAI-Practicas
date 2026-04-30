// --- Configuración y Constantes ---
const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
const scoreHomeEl = document.getElementById('score-home');
const scoreAwayEl = document.getElementById('score-away');
const modeTextEl = document.getElementById('game-mode-text');
const overlay = document.getElementById('overlay');
const menu = document.getElementById('menu');
const messageBox = document.getElementById('message');
const announcement = document.getElementById('announcement');
const countdownEl = document.getElementById('countdown');

// Ajuste de tamaño del canvas
canvas.width = 800;
canvas.height = 500;

const FRICTION = 0.98;
const BALL_BOUNCE = 0.7;
const PLAYER_SPEED = 3;
const BOT_SPEED = 2.2;
const KICK_FORCE = 7;

let gameState = 'MENU'; // MENU, COUNTDOWN, PLAYING, GOAL, FINISHED
let gameMode = '3goals'; // 3goals, golden
let score = { home: 0, away: 0 };
let timer = 0;
let keys = {};

// --- Entidades ---
class Entity {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    applyPhysics() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= FRICTION;
        this.vy *= FRICTION;

        // Colisión con bordes (rebote)
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -BALL_BOUNCE;
            this.x = this.x < this.radius ? this.radius : canvas.width - this.radius;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -BALL_BOUNCE;
            this.y = this.y < this.radius ? this.radius : canvas.height - this.radius;
        }
    }
}

class Player extends Entity {
    constructor(x, y, color, isBot = false) {
        super(x, y, 15, color);
        this.angle = 0; // Dirección de disparo
        this.isBot = isBot;
    }

    update() {
        if (this.isBot) {
            this.aiLogic();
        } else {
            if (keys['ArrowUp']) this.vy -= PLAYER_SPEED * 0.1;
            if (keys['ArrowDown']) this.vy += PLAYER_SPEED * 0.1;
            if (keys['ArrowLeft']) this.vx -= PLAYER_SPEED * 0.1;
            if (keys['ArrowRight']) this.vx += PLAYER_SPEED * 0.1;
            
            // Rotación de dirección de chute
            if (keys['a'] || keys['A']) this.angle -= 0.1;
            if (keys['d'] || keys['D']) this.angle += 0.1;

            if (keys[' ']) this.shoot();
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.9; // Frenado más rápido para jugadores (control)
        this.vy *= 0.9;

        // Limites del campo para jugadores
        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    draw() {
        super.draw();
        // Dibujar indicador de dirección
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle) * 25, this.y + Math.sin(this.angle) * 25);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }

    shoot() {
        const dist = Math.hypot(ball.x - this.x, ball.y - this.y);
        if (dist < this.radius + ball.radius + 5) {
            ball.vx = Math.cos(this.angle) * KICK_FORCE;
            ball.vy = Math.sin(this.angle) * KICK_FORCE;
        }
    }

    aiLogic() {
        // IA Simple: seguir la pelota
        const dx = ball.x - this.x;
        const dy = ball.y - this.y;
        const angleToBall = Math.atan2(dy, dx);
        
        this.vx += Math.cos(angleToBall) * BOT_SPEED * 0.05;
        this.vy += Math.sin(angleToBall) * BOT_SPEED * 0.05;

        // Chutar si está muy cerca
        if (Math.hypot(dx, dy) < this.radius + ball.radius + 2) {
            this.angle = angleToBall;
            this.shoot();
        }
    }
}

// --- Instancias ---
const player = new Player(150, canvas.height / 2, '#0095DD');
const bot = new Player(canvas.width - 150, canvas.height / 2, '#FF4136', true);
const ball = new Entity(canvas.width / 2, canvas.height / 2, 8, '#FFFFFF');

// --- Control de Teclado ---
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// --- Funciones de Juego ---
function startGame(mode) {
    gameMode = mode;
    score = { home: 0, away: 0 };
    scoreHomeEl.innerText = "0";
    scoreAwayEl.innerText = "0";
    modeTextEl.innerText = mode === '3goals' ? "A 3 goles" : "Gol de Oro";
    resetPositions();
    overlay.classList.add('hidden');
    startCountdown();
}

function resetPositions() {
    player.x = 150; player.y = canvas.height / 2;
    player.vx = 0; player.vy = 0;
    bot.x = canvas.width - 150; bot.y = canvas.height / 2;
    bot.vx = 0; bot.vy = 0;
    ball.x = canvas.width / 2; ball.y = canvas.height / 2;
    ball.vx = 0; ball.vy = 0;
}

function startCountdown() {
    gameState = 'COUNTDOWN';
    let count = 3;
    messageBox.classList.remove('hidden');
    announcement.innerText = "¡PREPARADOS!";
    
    const interval = setInterval(() => {
        countdownEl.innerText = count;
        if (count === 0) {
            clearInterval(interval);
            messageBox.classList.add('hidden');
            gameState = 'PLAYING';
        }
        count--;
    }, 800);
}

function checkGoal() {
    // Portería izquierda (Away marca)
    if (ball.x - ball.radius <= 0 && ball.y > 180 && ball.y < 320) {
        handleGoal('away');
    }
    // Portería derecha (Home marca)
    if (ball.x + ball.radius >= canvas.width && ball.y > 180 && ball.y < 320) {
        handleGoal('home');
    }
}

function handleGoal(team) {
    score[team]++;
    scoreHomeEl.innerText = score.home;
    scoreAwayEl.innerText = score.away;
    gameState = 'GOAL';
    
    announcement.innerText = team === 'home' ? "¡GOOOL!" : "¡GOL RIVAL!";
    messageBox.classList.remove('hidden');
    countdownEl.innerText = "";

    if ((gameMode === 'golden') || (gameMode === '3goals' && (score.home === 3 || score.away === 3))) {
        setTimeout(endGame, 1500);
    } else {
        setTimeout(() => {
            resetPositions();
            startCountdown();
        }, 1500);
    }
}

function endGame() {
    gameState = 'FINISHED';
    announcement.innerText = score.home > score.away ? "¡HAS GANADO EL PARTIDO!" : "DERROTA...";
    countdownEl.innerHTML = `<button onclick="location.reload()">Volver al Menú</button>`;
}

// --- Bucle Principal ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar campo (Líneas decorativas)
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Dibujar Porterías
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 180, 10, 140);
    ctx.fillRect(canvas.width - 10, 180, 10, 140);

    if (gameState === 'PLAYING' || gameState === 'GOAL') {
        player.update();
        bot.update();
        ball.applyPhysics();
        checkGoal();

        // Colisión Jugador-Pelota básica
        [player, bot].forEach(p => {
            const dx = ball.x - p.x;
            const dy = ball.y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < p.radius + ball.radius) {
                const angle = Math.atan2(dy, dx);
                ball.vx += Math.cos(angle) * 0.5;
                ball.vy += Math.sin(angle) * 0.5;
            }
        });
    }

    player.draw();
    bot.draw();
    ball.draw();

    requestAnimationFrame(loop);
}

loop();