/* jshint esversion: 6 */

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
let countdownInterval = null;
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
const player = { x: 200, y: HEIGHT / 2, radius: 18, color: "#2d7ff9", speed: 4.8, angle: 0 };
const ball = { x: WIDTH / 2, y: HEIGHT / 2, radius: 10, vx: 0, vy: 0, friction: 0.985, color: "white" };

const bots = [
    { x: 80, y: HEIGHT/2, radius: 18, color: "#4fc3f7", speed: 3.2, team: "player", role: "portero" },
    { x: WIDTH - 80, y: HEIGHT/2, radius: 18, color: "#f92d2d", speed: 3.0, team: "bot", role: "portero" },
    { x: WIDTH - 200, y: 150, radius: 18, color: "#f92d2d", speed: 3.8, team: "bot", role: "delantero" }
];

const powerShot = { charging: false, power: 0, maxPower: 18 };

// --- MENÚS ---
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
        <p class="controls-hint">Flechas: Mover | A/D: Girar | Espacio: <b>Cargar Chute</b><br>R: Reiniciar | M: Menú</p>
    `;
}

function selectMode(mode) {
    gameMode = mode;
    score.player = 0; score.bot = 0;
    overlay.classList.add("hidden");
    if (!isMuted) { bgMusic.play(); }
    startCountdown();
}

function startCountdown() {
    gameState = "COUNTDOWN";
    countdownValue = 3;
    resetPositions();
    if(countdownInterval) { clearInterval(countdownInterval); }
    countdownInterval = setInterval(() => {
        countdownValue--;
        if (countdownValue <= 0) {
            clearInterval(countdownInterval);
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
    powerShot.charging = false;
    powerShot.power = 0;
}

// --- INPUTS ---
window.addEventListener("keydown", e => { 
    keys[e.code] = true; 
    if (e.key.toLowerCase() === 'r') {
        score.player = 0; score.bot = 0;
        overlay.classList.add("hidden");
        startCountdown();
    }
    if (e.key.toLowerCase() === 'm') {
        if(countdownInterval) { clearInterval(countdownInterval); }
        gameState = "MENU";
        overlay.classList.remove("hidden");
        renderMenu();
    }
    if (e.code === "Space" && gameState === "PLAYING") {
        powerShot.charging = true;
    }
});

window.addEventListener("keyup", e => { 
    keys[e.code] = false; 
    if (e.code === "Space" && gameState === "PLAYING") {
        releasePowerShot();
    }
});

function releasePowerShot() {
    if (!powerShot.charging) return;
    let dx = ball.x - player.x;
    let dy = ball.y - player.y;
    let dist = Math.hypot(dx, dy);

    if (dist < player.radius + ball.radius + 20) {
        ball.vx = Math.cos(player.angle) * powerShot.power;
        ball.vy = Math.sin(player.angle) * powerShot.power;
        kickSound.currentTime = 0;
        kickSound.play();
    }
    powerShot.charging = false;
    powerShot.power = 0;
}

function update() {
    if (gameState !== "PLAYING") return;

    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.KeyA) player.angle -= 0.08;
    if (keys.KeyD) player.angle += 0.08;
    keepInside(player);

    if (powerShot.charging) {
        powerShot.power = Math.min(powerShot.power + 0.4, powerShot.maxPower);
    }

    bots.forEach(b => {
        if (b.role === "portero") {
            let targetY = Math.max(180, Math.min(320, ball.y));
            if (Math.abs(b.y - targetY) > 5) { b.y += (b.y < targetY ? 1 : -1) * b.speed; }
        } else {
            let dx = ball.x - b.x;
            let dy = ball.y - b.y;
            let dist = Math.hypot(dx, dy);
            let isBallInCorner = (ball.x < 65 || ball.x > WIDTH - 65) && (ball.y < 65 || ball.y > HEIGHT - 65);
            
            if (isBallInCorner && dist < 45) {
                b.x += (WIDTH/2 - b.x) * 0.02;
                b.y += (HEIGHT/2 - b.y) * 0.02;
            } else if (dist > 5) {
                b.x += (dx / dist) * b.speed;
                b.y += (dy / dist) * b.speed;
            }
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
    const m = 20;

    if (ball.y - ball.radius < m) { ball.y = m + ball.radius; ball.vy *= bounce; ball.vx += (Math.random() - 0.5); }
    if (ball.y + ball.radius > HEIGHT - m) { ball.y = HEIGHT - m - ball.radius; ball.vy *= bounce; ball.vx += (Math.random() - 0.5); }

    if (ball.x - ball.radius < m) {
        if (ball.y > 180 && ball.y < 320) { 
            if (ball.x < 0) { scorePoint("bot"); } 
        }
        else { ball.x = m + ball.radius; ball.vx *= bounce; ball.vy += (Math.random() - 0.5); }
    } else if (ball.x + ball.radius > WIDTH - m) {
        if (ball.y > 180 && ball.y < 320) { 
            if (ball.x > WIDTH) { scorePoint("player"); } 
        }
        else { ball.x = WIDTH - m - ball.radius; ball.vx *= bounce; ball.vy += (Math.random() - 0.5); }
    }
}

function checkCollision(obj) {
    let dx = ball.x - obj.x;
    let dy = ball.y - obj.y;
    let dist = Math.hypot(dx, dy);
    let minDist = obj.radius + ball.radius;

    if (dist < minDist) {
        let angle = Math.atan2(dy, dx);
        let force = 7.5;
        ball.vx = Math.cos(angle) * force;
        ball.vy = Math.sin(angle) * force;
        let overlap = minDist - dist + 2;
        ball.x += Math.cos(angle) * overlap;
        ball.y += Math.sin(angle) * overlap;
        kickSound.currentTime = 0;
        kickSound.play();
    }
}

function scorePoint(who) {
    if (who === "player") { score.player++; } else { score.bot++; }
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
    menuContent.innerHTML = `<h2>${score.player > score.bot ? "¡VICTORIA!" : "DERROTA..."}</h2><p style="font-size:2rem">${score.player} - ${score.bot}</p><button onclick="selectMode('${gameMode}')">Reiniciar</button><button onclick="backToMenu()">Menú</button>`;
}

function backToMenu() { gameState = "MENU"; overlay.classList.remove("hidden"); renderMenu(); }

function keepInside(obj) {
    const m = 20;
    obj.x = Math.max(obj.radius + m, Math.min(WIDTH - obj.radius - m, obj.x));
    obj.y = Math.max(obj.radius + m, Math.min(HEIGHT - obj.radius - m, obj.y));
}

function draw() {
    for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#2c8f4a" : "#247e40";
        ctx.fillRect(i * (WIDTH / 10), 0, WIDTH / 10, HEIGHT);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40);
    ctx.beginPath(); ctx.moveTo(WIDTH / 2, 20); ctx.lineTo(WIDTH / 2, HEIGHT - 20); ctx.stroke();
    ctx.beginPath(); ctx.arc(WIDTH / 2, HEIGHT / 2, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(20, 120, 80, 260); ctx.strokeRect(WIDTH - 100, 120, 80, 260);
    ctx.strokeStyle = "white"; ctx.strokeRect(0, 180, 20, 140); ctx.strokeRect(WIDTH - 20, 180, 20, 140);

    ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); ctx.fill();

    [player, ...bots].forEach(b => {
        ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
        
        if (b === player) {
            ctx.beginPath(); ctx.strokeStyle = "yellow"; ctx.lineWidth = 3; ctx.moveTo(b.x, b.y);
            ctx.lineTo(b.x + Math.cos(b.angle) * 30, b.y + Math.sin(b.angle) * 30); ctx.stroke();

            if (powerShot.charging) {
                ctx.strokeStyle = "#ffeb3b";
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius + 8, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * (powerShot.power/powerShot.maxPower)));
                ctx.stroke();
            }
        }
    });

    stateEl.innerText = `${score.player} - ${score.bot}`;
    if (gameState === "COUNTDOWN") {
        ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0,0,WIDTH,HEIGHT);
        ctx.fillStyle = "white"; ctx.font = "bold 80px Arial"; ctx.textAlign = "center";
        ctx.fillText(countdownValue, WIDTH/2, HEIGHT/2 + 30);
    }
}

function loop() { update(); draw(); requestAnimationFrame(loop); }
function changeTrack(i) { bgMusic.pause(); currentTrackIndex = i; bgMusic = new Audio(tracks[i].file); bgMusic.loop = true; if(!isMuted) { bgMusic.play(); } renderMenu(); }

function toggleMusic() { 
    isMuted = !isMuted; 
    if (isMuted) {
        bgMusic.pause();
    } else {
        bgMusic.play();
    }
    renderMenu(); 
}

renderMenu();
loop();