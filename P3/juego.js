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

// --- RECURSOS (CON CONTROL DE ERRORES) ---
const playerImg = new Image(); playerImg.src = 'nave.png';
const alienImg = new Image(); alienImg.src = 'alien_verde.png';
const explosionImg = new Image(); explosionImg.src = 'explosion.png';

// Función para cargar sonidos de forma segura
function cargarSonido(ruta) {
    const audio = new Audio(ruta);
    audio.addEventListener('error', () => console.warn(`No se pudo cargar el sonido: ${ruta}. El juego continuará en silencio.`));
    return audio;
}

const shootSound = cargarSonido('disparo.m4a');
const explosionSound = cargarSonido('explosion.m4a');
const gameOverSound = cargarSonido('gameover.m4a');
const victoriaSound = cargarSonido('victoria.m4a'); 

// --- VARIABLES DE ESTADO ---
let score, lives, energy, gameRunning, currentUser;
let player, bullets, enemyBullets, aliens, explosions, alienDirection, alienSpeed;
const keys = {};

const ENERGY_COST = 20;
const ENERGY_RECOVERY = 0.4;

// --- GESTIÓN DE INICIO MEJORADA ---
btnStart.addEventListener('click', () => {
    const name = usernameInput.value.trim();
    if (name.length < 3) {
        alert("Comandante, introduzca un nombre válido (mín. 3 letras)");
        return;
    }

    // "DESPERTAR" AUDIOS PARA EL NAVEGADOR
    // Esto desbloquea los permisos de audio en Chrome/Safari
    [shootSound, explosionSound, gameOverSound, victoriaSound].forEach(s => {
        s.play().then(() => {
            s.pause();
            s.currentTime = 0;
        }).catch(() => {
            console.log("Audio esperando interacción real...");
        });
    });

    currentUser = name;
    loginOverlay.classList.add('hidden');
    initGame();
    requestAnimationFrame(update);
});

function initGame() {
    score = 0; lives = 3; energy = 100; 
    alienSpeed = 0.7; 
    alienDirection = 1; 
    gameRunning = true;

    player = { x: 370, y: 520, w: 60, h: 60, speed: 6 };
    bullets = []; enemyBullets = []; explosions = []; aliens = [];
    
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

function update() {
    if (!gameRunning) return;

    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
if (keys.ArrowRight && player.x < canvas.width - player.w) player.x += player.speed;

    if (energy < 100) energy += ENERGY_RECOVERY;
    energyBar.style.width = energy + '%';

    bullets.forEach((b, i) => { b.y -= 9; if (b.y < 0) bullets.splice(i, 1); });

    const aliveAliens = aliens.filter(a => a.alive);
    const numEliminados = 24 - aliveAliens.length;

    let factorDificultad = 1 + (numEliminados * 0.05); 
    let velocidadActual = alienSpeed * factorDificultad;
    let probabilidadDisparo = 0.01 + (numEliminados * 0.002); 

    let tocaBorde = false;
    aliveAliens.forEach(a => {
        a.x += velocidadActual * alienDirection;
        if (a.x <= 10 || a.x + a.w >= canvas.width - 10) tocaBorde = true;
        if (a.y + a.h >= player.y) endGame(false); 
    });

    if (tocaBorde) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 15);
    }

    if (Math.random() < probabilidadDisparo && aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        enemyBullets.push({ x: shooter.x + shooter.w/2, y: shooter.y + shooter.h, w: 4, h: 12 });
    }

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

    bullets.forEach((b, bi) => {
        aliens.forEach(a => {
            if (a.alive && b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                a.alive = false;
                bullets.splice(bi, 1);
                score += 10;
                scoreEl.innerText = score;
                
                explosions.push({x: a.x, y: a.y, w: a.w, h: a.h, timer: 15});
                
                // Reproducción segura de sonido
                if (explosionSound.readyState >= 2) {
                    explosionSound.currentTime = 0;
                    explosionSound.play().catch(()=>{});
                }
                
                if (aliens.filter(al => al.alive).length === 0) endGame(true);
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar Nave
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    
    // Dibujar Aliens
    aliens.forEach(a => { if (a.alive) ctx.drawImage(alienImg, a.x, a.y, a.w, a.h); });
    
    // Balas
    ctx.fillStyle = "#00ffcc"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = "#ff4444"; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));
    
    // Explosiones
    explosions.forEach((ex, i) => {
        if (explosionImg.complete && explosionImg.naturalWidth !== 0) {
            ctx.drawImage(explosionImg, ex.x, ex.y, ex.w, ex.h);
        } else {
            // Círculo naranja de respaldo si la imagen falla
            ctx.fillStyle = "orange";
            ctx.beginPath(); ctx.arc(ex.x + ex.w/2, ex.y + ex.h/2, 20, 0, Math.PI*2); ctx.fill();
        }
        ex.timer--; 
        if (ex.timer <= 0) explosions.splice(i, 1);
    });
}

window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameRunning) {
        if (energy >= ENERGY_COST) {
            bullets.push({ x: player.x + player.w / 2 - 3, y: player.y, w: 6, h: 15 });
            energy -= ENERGY_COST;
            
            // Reproducción segura de sonido
            if (shootSound.readyState >= 2) {
                shootSound.currentTime = 0;
                shootSound.play().catch(()=>{});
            }
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
    
    if (win) {
        messageTextEl.innerText = "¡VICTORIA!";
        messageTextEl.style.color = "#00ffcc";
        
        // Forzamos reproducción
        victoriaSound.currentTime = 0;
        victoriaSound.play().catch(e => console.error("Error victoria:", e));
        
        saveRanking(currentUser, crono.min, crono.seg, crono.cent);
    } else {
        messageTextEl.innerText = "GAME OVER";
        messageTextEl.style.color = "#ff4444";
        
        // Forzamos reproducción
        gameOverSound.currentTime = 0;
        gameOverSound.play().catch(e => console.error("Error gameover:", e));
    }
}

// Persistencia de Ranking
function saveRanking(name, min, seg, cent) {
    const totalCent = (parseInt(min) * 6000) + (parseInt(seg) * 100) + parseInt(cent);
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

// Prevenir scroll
window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);