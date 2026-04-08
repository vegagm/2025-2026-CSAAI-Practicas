const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

canvas.width = 800;
canvas.height = 600;

//-- Teclado
let keys = {};
let shootPressed = false;

document.addEventListener("keydown", e => {
    keys[e.code] = true;

    if (e.code === "Space" && !shootPressed) {
        shoot();
        shootPressed = true;
    }
});

document.addEventListener("keyup", e => {
    keys[e.code] = false;

    if (e.code === "Space") shootPressed = false;
});

// document.addEventListener("keydown", e => keys[e.code] = true);
// document.addEventListener("keyup", e => keys[e.code] = false);

//--Botones móvil
document.getElementById("leftBtn").onclick = () => player.x -= 30;
document.getElementById("rightBtn").onclick = () => player.x += 30;
document.getElementById("shootBtn").onclick = shoot;

//--Jugador
class Player {
    constructor() {
        this.width = 50;
        this.height = 20;
        this.x = canvas.width / 2 - 25;
        this.y = canvas.height - 50;
        this.speed = 6;
        this.lives = 3;
        this.energy = 5;
        this.maxEnergy = 5;
    }

    update() {
        if (keys["ArrowLeft"]) this.x -= this.speed;
        if (keys["ArrowRight"]) this.x += this.speed;

        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    }

    draw() {
        ctx.fillStyle = "cyan";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

//-- Bullets
class Bullet {
    constructor(x, y, speed, color) {
        this.x = x;
        this.y = y;
        this.width = 2;
        this.height = 8;
        this.speed = speed;
        this.color = color;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        // ctx.fillStyle = this.color;
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.stroke();
    }
}

//-- Aliens
class Alien {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
    }

    draw() {
        ctx.fillStyle = "lime";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

//--Variables
const player = new Player();
let bullets = [];
let enemyBullets = [];
let aliens = [];
let score = 0;
let gameOver = false;
let victory = false;

let alienDirection = 1;
let alienSpeed = 1;

// Crear aliens
for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
        aliens.push(new Alien(80 + col * 60, 50 + row * 40));
    }
}

//-- Disparo jugador
function shoot() {
    if (player.energy > 0) {
        bullets.push(new Bullet(player.x + player.width / 2, player.y, -8, "red"));
        player.energy--;
    }
}

//-- Recarga
setInterval(() => {
    if (player.energy < player.maxEnergy) player.energy++;
}, 500);

//-- Disparo del enemigo
// setInterval(() => {
//     if (aliens.length > 0) {
//         let a = aliens[Math.floor(Math.random() * aliens.length)];
//         enemyBullets.push(new Bullet(a.x + 20, a.y, 4, "yellow"));
//     }
// }, 1000);

setInterval(() => {
    if (aliens.length > 0 && Math.random() < 0.7) {
        let a = aliens[Math.floor(Math.random() * aliens.length)];
        enemyBullets.push(new Bullet(a.x + a.width / 2, a.y, 4, "yellow"));
    }
}, 800);

//-- Update
function update() {
    if (gameOver) return;

    player.update();

    bullets.forEach((b, i) => {
        b.update();

        aliens.forEach((a, j) => {
            if (
                b.x < a.x + a.width &&
                b.x > a.x &&
                b.y < a.y + a.height &&
                b.y > a.y
            ) {
                aliens.splice(j,1);
                bullets.splice(i,1);
                score += 10;
            }
        });
    });

    enemyBullets = enemyBullets.filter(b => {
    b.update();

    if (
        b.x < player.x + player.width &&
        b.x > player.x &&
        b.y < player.y + player.height &&
        b.y > player.y
    ) {
        player.lives--;
        if (player.lives <= 0) gameOver = true;
        return false;
    }

    return b.y < canvas.height;
    });

    //-- Movimiento de los aliens
    let edge = false;

    aliens.forEach(a => {
        a.x += alienSpeed * alienDirection;
        if (a.x < 0 || a.x + a.width > canvas.width) edge = true;
    });

    if (edge) {
        alienDirection *= -1;
        aliens.forEach(a => a.y += 20);
    }

    //-- Se aumenta la dificultad
    alienSpeed = 1 + (24 - aliens.length)*0.1;

    //--Victoria
    if (aliens.length === 0) {
        victory = true;
        gameOver = true;
    }
}

//-- Dibujar
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    player.draw();
    bullets.forEach(b => b.draw());
    enemyBullets.forEach(b => b.draw());
    aliens.forEach(a => a.draw());

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Puntuación: " + score, 10, 20);
    ctx.fillText("Vidas: " + player.lives, 10, 40);
    ctx.fillText("Energía: " + player.energy, 10, 60);
    ctx.fillText("Tiempo: " + getTime(), 10, 80);

    if (gameOver) {
        ctx.font = "40px Arial";
        ctx.fillText(victory ? "VICTORIA" : "GAME OVER", 250, 300);
    }
}

//-- Loop
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
