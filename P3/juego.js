const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesContainer = document.getElementById('lives-container');
const energyBar = document.getElementById('energy-bar');
const overlayEl = document.getElementById('message-overlay');
const messageTextEl = document.getElementById('message-text');
const restartBtn = document.getElementById('restart-button');

// --- INTEGRACIÓN CRONÓMETRO ---
const timerDisplay = document.getElementById('timer-display');
const crono = new Cronometro(timerDisplay); 

canvas.width = 800;
canvas.height = 600;

// --- RECURSOS ---
const playerImg = new Image();
playerImg.src = 'nave.png';

const alienImages = {
    verde: new Image(),
    magenta: new Image(),
    rojo: new Image()
};
alienImages.verde.src = 'alien_verde.png';
alienImages.magenta.src = 'alien_rosa.png';
alienImages.rojo.src = 'alien_rojo.png';

const shootSound = new Audio(''); 
const explosionSound = new Audio(''); 
const gameOverSound = new Audio('');

// --- VARIABLES DE ESTADO ---
let score, lives, energy, gameRunning, mode;
let player, bullets, enemyBullets, aliens, explosions;
let alienDirection, alienSpeed;
const keys = {}; // Objeto para las teclas

const ENERGY_COST = 20;
const ENERGY_RECOVERY = 0.4;

// --- FUNCIÓN PARA PASAR LA PANTALLA DE INICIO ---
function startGameMode(chosenMode) {
    mode = chosenMode;
    // Ocultar selector
    document.getElementById('selector-overlay').classList.add('hidden');
    
    // Si es móvil, mostrar botones táctiles
    if (mode === 'mobile') {
        document.getElementById('mobile-controls').classList.remove('hidden');
        configurarControlesTactiles();
    }
    
    initGame();
    update();
}

function initGame() {
    score = 0;
    lives = 3;
    energy = 100;
    alienSpeed = 0.8;
    alienDirection = 1;
    gameRunning = true;

    player = { x: 370, y: 520, w: 60, h: 60, speed: 6 };
    bullets = [];
    enemyBullets = [];
    explosions = [];
    
    aliens = [];
    for (let i = 0; i < 3; i++) {
        let type = i === 0 ? 'verde' : i === 1 ? 'magenta' : 'rojo';
        for (let j = 0; j < 8; j++) {
            aliens.push({
                x: 80 + j * 80,
                y: 100 + i * 60,
                w: 45,
                h: 35,
                type: type,
                image: alienImages[type],
                alive: true
            });
        }
    }

    scoreEl.innerText = score;
    updateLivesUI();
    overlayEl.classList.add('hidden');
    
    // Iniciar Cronómetro
    crono.reset();
    crono.start();
}

function configurarControlesTactiles() {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnShoot = document.getElementById('btn-shoot');

    // Manejo de toques (touchstart y touchend)
    const setupBtn = (el, key) => {
        el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
        el.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
    };

    setupBtn(btnLeft, 'ArrowLeft');
    setupBtn(btnRight, 'ArrowRight');
    
    btnShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameRunning && energy >= ENERGY_COST) disparar();
    });
}

function disparar() {
    bullets.push({ x: player.x + player.w / 2 - 3, y: player.y, w: 6, h: 15 });
    energy -= ENERGY_COST;
    if (shootSound.src) shootSound.play();
}

function updateLivesUI() {
    livesContainer.innerHTML = 'Vidas: ';
    for (let i = 0; i < lives; i++) {
        const icon = document.createElement('img');
        icon.src = 'nave.png';
        icon.style.width = '20px';
        icon.style.marginRight = '5px';
        icon.onerror = () => { icon.style.background = 'white'; };
        livesContainer.appendChild(icon);
    }
}

function update() {
    if (!gameRunning) return;

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    if (energy < 100) energy += ENERGY_RECOVERY;
    energyBar.style.width = energy + '%';

    bullets.forEach((b, i) => {
        b.y -= 9;
        if (b.y < 0) bullets.splice(i, 1);
    });

    let tocaBordeLateral = false;
    aliens.forEach(a => {
        if (!a.alive) return;
        a.x += alienSpeed * alienDirection;
        if (a.x <= 10 || a.x + a.w >= canvas.width - 10) tocaBordeLateral = true;
        if (a.y + a.h >= canvas.height - 20) endGame(false);
    });

    if (tocaBordeLateral) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 15);
    }

    const aliveAliens = aliens.filter(a => a.alive);
    if (Math.random() < 0.02 && aliveAliens.length > 0) {
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
                explosions.push({x: a.x, y: a.y, timer: 15});
                alienSpeed += 0.03;
                if (aliens.filter(al => al.alive).length === 0) endGame(true);
            }
        });
    });

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    } else {
        ctx.fillStyle = "blue";
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }
    aliens.forEach(a => {
        if (!a.alive) return;
        if (a.image.complete && a.image.naturalWidth !== 0) {
            ctx.drawImage(a.image, a.x, a.y, a.w, a.h);
        } else {
            ctx.fillStyle = "grey";
            ctx.fillRect(a.x, a.y, a.w, a.h);
        }
    });
    ctx.fillStyle = "#00ffcc";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    ctx.fillStyle = "#ff4444";
    enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));
    explosions.forEach((ex, i) => {
        ctx.fillStyle = "rgba(255, 165, 0, " + (ex.timer / 15) + ")";
        ctx.beginPath();
        ctx.arc(ex.x + 20, ex.y + 15, 20, 0, Math.PI*2);
        ctx.fill();
        ex.timer--;
        if (ex.timer <= 0) explosions.splice(i, 1);
    });
}

// --- CONTROLES TECLADO ---
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && gameRunning && energy >= ENERGY_COST) {
        disparar();
    }
});
window.addEventListener('keyup', e => keys[e.code] = false);

function endGame(win) {
    gameRunning = false;
    crono.stop(); // Parar cronómetro
    overlayEl.classList.remove('hidden');
    messageTextEl.innerText = win ? "¡VICTORIA!" : "GAME OVER";
    messageTextEl.style.color = win ? "#00ffcc" : "#ff4444";
    if(!win && gameOverSound.src) gameOverSound.play();
}

restartBtn.onclick = initGame;
window.startGameMode = startGameMode;

document.getElementById('btn-pc').addEventListener('click', () => {
    startGameMode('pc');
});

document.getElementById('btn-mobile').addEventListener('click', () => {
    startGameMode('mobile');
});