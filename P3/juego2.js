const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const energyBar = document.getElementById('energy-bar');
const messageEl = document.getElementById('message');

canvas.width = 800;
canvas.height = 600;

// Configuración de juego
let score = 0;
let lives = 3;
let energy = 100;
const ENERGY_RECOVERY = 0.5; 
const ENERGY_COST = 20;
let gameRunning = true;

// Imágenes (Placeholders con formas)
const player = { x: 375, y: 540, w: 50, h: 40, speed: 7 };
const bullets = [];
const enemyBullets = [];
const aliens = [];
const explosions = [];

// Crear flota inicial
const rows = 3;
const cols = 8;
const alienW = 40;
const alienH = 30;
let alienDirection = 1;
let alienSpeed = 1;

function initAliens() {
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            aliens.push({
                x: 100 + j * 70,
                y: 50 + i * 50,
                w: alienW,
                h: alienH,
                alive: true
            });
        }
    }
}

// Sonidos mediante Web Audio API
function playSound(freq, type, duration) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

// Controles
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function shoot() {
    if (energy >= ENERGY_COST) {
        bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 15 });
        energy -= ENERGY_COST;
        playSound(400, 'sawtooth', 0.1); // Sonido Antimateria
    }
}

// Bucle principal
function update() {
    if (!gameRunning) return;

    // Movimiento Jugador
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;
    if (keys['Space'] && !keys.spacePressed) {
        shoot();
        keys.spacePressed = true; // Evita ráfaga infinita por pulsación
    }
    if (!keys['Space']) keys.spacePressed = false;

    // Recarga de energía
    if (energy < 100) energy = Math.min(100, energy + ENERGY_RECOVERY);
    energyBar.style.width = energy + '%';

    // Movimiento Balas
    bullets.forEach((b, i) => {
        b.y -= 8;
        if (b.y < 0) bullets.splice(i, 1);
    });

    enemyBullets.forEach((eb, i) => {
        eb.y += 5;
        if (eb.y > canvas.height) enemyBullets.splice(i, 1);
        
        // Colisión con Jugador
        if (eb.x < player.x + player.w && eb.x + eb.w > player.x && eb.y < player.y + player.h && eb.y + eb.h > player.y) {
            lives--;
            livesEl.innerText = lives;
            enemyBullets.splice(i, 1);
            playSound(100, 'square', 0.3);
            if (lives <= 0) endGame(false);
        }
    });

    // Movimiento Aliens
    let edgeReached = false;
    aliens.forEach(a => {
        if (!a.alive) return;
        a.x += alienSpeed * alienDirection;
        if (a.x <= 0 || a.x + a.w >= canvas.width) edgeReached = true;
    });

    if (edgeReached) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 10);
    }

    // Disparo Enemigo Aleatorio
    if (Math.random() < 0.015) { // Aprox 1 vez por segundo
        const aliveAliens = aliens.filter(a => a.alive);
        if (aliveAliens.length > 0) {
            const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
            enemyBullets.push({ x: shooter.x + shooter.w/2, y: shooter.y, w: 4, h: 10 });
        }
    }

    // Colisiones Bala -> Alien
    bullets.forEach((b, bi) => {
        aliens.forEach(a => {
            if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                a.alive = false;
                bullets.splice(bi, 1);
                score += 10;
                scoreEl.innerText = score;
                explosions.push({x: a.x, y: a.y, timer: 15});
                playSound(150, 'noise', 0.2); // Explosión
                
                // Aumentar velocidad
                const remaining = aliens.filter(al => al.alive).length;
                alienSpeed = 1 + (24 - remaining) * 0.15;
                
                if (remaining === 0) endGame(true);
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Jugador (Nave azul)
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Dibujar Aliens (Verdes)
    ctx.fillStyle = '#00ff88';
    aliens.forEach(a => {
        if (a.alive) ctx.fillRect(a.x, a.y, a.w, a.h);
    });

    // Dibujar Balas
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    // Dibujar Balas Enemigas
    ctx.fillStyle = '#f00';
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));

    // Dibujar Explosiones
    ctx.fillStyle = '#ffa500';
    explosions.forEach((ex, i) => {
        ctx.beginPath();
        ctx.arc(ex.x + alienW/2, ex.y + alienH/2, 20, 0, Math.PI*2);
        ctx.fill();
        ex.timer--;
        if (ex.timer <= 0) explosions.splice(i, 1);
    });
}

function endGame(win) {
    gameRunning = false;
    messageEl.classList.remove('hidden');
    if (win) {
        messageEl.innerText = "¡VICTORIA! Sector a salvo.";
        messageEl.style.color = "#00ffcc";
        playSound(600, 'sine', 0.5);
    } else {
        messageEl.innerText = "GAME OVER - Humanidad esclavizada";
        messageEl.style.color = "#ff0044";
        playSound(50, 'sawtooth', 1);
    }
}

initAliens();
update();