const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesContainer = document.getElementById('lives-container');
const energyBar = document.getElementById('energy-bar');
const overlayEl = document.getElementById('message-overlay');
const messageTextEl = document.getElementById('message-text');
const loginOverlay = document.getElementById('login-overlay');
const usernameInput = document.getElementById('username-input');
const btnStart = document.getElementById('btn-start');

const timerDisplay = document.getElementById('timer-display');
const crono = new Cronometro(timerDisplay); 

canvas.width = 800;
canvas.height = 600;

// --- RECURSOS ---
const playerImg = new Image(); playerImg.src = 'nave.png';
const alienImg = new Image(); alienImg.src = 'alien_verde.png';

// --- VARIABLES DE ESTADO ---
let score, lives, energy, gameRunning, currentUser;
let player, bullets, enemyBullets, aliens, explosions, alienDirection, alienSpeed;
const keys = {};

const ENERGY_COST = 20;
const ENERGY_RECOVERY = 0.4;

// --- GESTIÓN DE INICIO ---
btnStart.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name.length < 3) {
        alert("Comandante, introduzca un nombre válido (mín. 3 letras)");
        return;
    }
    currentUser = name;
    loginOverlay.classList.add('hidden');
    initGame();
    // Importante: Llamamos a update() solo una vez aquí para que empiece el bucle
    requestAnimationFrame(update);
});

function initGame() {
    score = 0; lives = 3; energy = 100; 
    alienSpeed = 0.7; // Empezamos lento
    alienDirection = 1; 
    gameRunning = true;

    player = { x: 370, y: 520, w: 60, h: 60, speed: 6 };
    bullets = []; enemyBullets = []; explosions = []; aliens = [];
    
    // Generar 3 filas de 8 marcianos (TODOS VERDES)
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 8; j++) {
            aliens.push({ 
                x: 100 + j * 80, 
                y: 100 + i * 60, 
                w: 45, h: 35, 
                alive: true 
            });
        }
    }
    
    scoreEl.innerText = score;
    updateLivesUI();
    overlayEl.classList.add('hidden');
    document.getElementById('ranking-container').classList.add('hidden');
    crono.reset();
    crono.start();
}

// --- LÓGICA DE DIFICULTAD PROGRESIVA ---
function update() {
    if (!gameRunning) return;

    // Movimiento Nave
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    // Energía Arma
    if (energy < 100) energy += ENERGY_RECOVERY;
    energyBar.style.width = energy + '%';

    // Balas Jugador
    bullets.forEach((b, i) => { b.y -= 9; if (b.y < 0) bullets.splice(i, 1); });

    // --- PROGRESIÓN ---
    const totalAliens = 24;
    const aliveAliens = aliens.filter(a => a.alive);
    const numEliminados = totalAliens - aliveAliens.length;

    // Aumentar velocidad y frecuencia de disparo según eliminados
    let factorDificultad = 1 + (numEliminados * 0.05); // Aumenta un 5% por cada alien muerto
    let velocidadActual = alienSpeed * factorDificultad;
    let probabilidadDisparo = 0.01 + (numEliminados * 0.002); // Disparan más a menudo

    // Movimiento Aliens
    let tocaBorde = false;
    aliveAliens.forEach(a => {
        a.x += velocidadActual * alienDirection;
        if (a.x <= 10 || a.x + a.w >= canvas.width - 10) tocaBorde = true;
        if (a.y + a.h >= player.y) endGame(false); // Derrota por invasión
    });

    if (tocaBorde) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 15);
    }

    // Disparos Enemigos Progresivos
    if (Math.random() < probabilidadDisparo && aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        enemyBullets.push({ x: shooter.x + shooter.w/2, y: shooter.y + shooter.h, w: 4, h: 12 });
    }

    // Balas Enemigas -> Jugador
    enemyBullets.forEach((eb, i) => {
        eb.y += 4;
        if (eb.y > canvas.height) enemyBullets.splice(i, 1);
        if (eb.x < player.x + player.w && eb.x + eb.w > player.x && eb.y < player.y + player.h && eb.y + eb.h > player.y) {
            enemyBullets.splice(i, 1);
            lives--;
            updateLivesUI();
            if (lives <= 0) endGame(false);
        }
    });

    // Balas Jugador -> Alien
    bullets.forEach((b, bi) => {
        aliens.forEach(a => {
            if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                a.alive = false;
                bullets.splice(bi, 1);
                score += 10;
                scoreEl.innerText = score;
                explosions.push({x: a.x, y: a.y, timer: 15});
                if (aliens.filter(al => al.alive).length === 0) endGame(true);
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    aliens.forEach(a => { if (a.alive) ctx.drawImage(alienImg, a.x, a.y, a.w, a.h); });
    ctx.fillStyle = "#00ffcc"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = "#ff4444"; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));
    
    explosions.forEach((ex, i) => {
        ctx.fillStyle = "rgba(255, 165, 0, " + (ex.timer / 15) + ")";
        ctx.beginPath(); ctx.arc(ex.x + 20, ex.y + 15, 20, 0, Math.PI*2); ctx.fill();
        ex.timer--; if (ex.timer <= 0) explosions.splice(i, 1);
    });
}

// --- CONTROLES Y FINAL ---
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameRunning) {
        if (energy >= ENERGY_COST) {
            bullets.push({ x: player.x + player.w / 2 - 3, y: player.y, w: 6, h: 15 });
            energy -= ENERGY_COST;
        }
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function updateLivesUI() {
    livesContainer.innerHTML = 'Vidas: ';
    for (let i = 0; i < lives; i++) {
        const icon = document.createElement('img');
        icon.src = 'nave.png'; icon.style.width = '20px'; icon.style.marginRight = '5px';
        livesContainer.appendChild(icon);
    }
}

function endGame(win) {
    gameRunning = false;
    crono.stop();
    overlayEl.classList.remove('hidden');
    messageTextEl.innerText = win ? "¡VICTORIA!" : "GAME OVER";
    messageTextEl.style.color = win ? "#00ffcc" : "#ff4444";
    if (win) {
        saveRanking(currentUser, crono.min, crono.seg, crono.cent);
    }
}

// Las funciones saveRanking y showRanking se mantienen igual que en la versión anterior
function saveRanking(name, min, seg, cent) {
    const totalCent = (min * 6000) + (seg * 100) + cent;
    const timeStr = `${min}:${seg}:${cent}`;
    let ranking = JSON.parse(localStorage.getItem('invasionRanking')) || [];
    const existingIndex = ranking.findIndex(r => r.name === name);
    if (existingIndex !== -1) {
        if (totalCent < ranking[existingIndex].totalCent) {
            ranking[existingIndex] = { name, timeStr, totalCent };
        }
    } else {
        ranking.push({ name, timeStr, totalCent });
    }
    ranking.sort((a, b) => a.totalCent - b.totalCent);
    ranking = ranking.slice(0, 10);
    localStorage.setItem('invasionRanking', JSON.stringify(ranking));
    showRanking();
}

function showRanking() {
    const ranking = JSON.parse(localStorage.getItem('invasionRanking')) || [];
    const body = document.getElementById('ranking-body');
    body.innerHTML = "";
    ranking.forEach((r, i) => {
        body.innerHTML += `<tr><td>${i+1}</td><td>${r.name}</td><td>${r.timeStr}</td></tr>`;
    });
    document.getElementById('ranking-container').classList.remove('hidden');
}