const BALL_SPAWN_WARMUP = 2;
const BALL_SPAWN_INTERVAL = 20;
const BALL_RADIUS = 20;
const BALL_COUNT_INITIAL = 4;
const BALL_SPEED_INITIAL = 3;

const gameCanvas = document.getElementById("game");
const statsCanvas = document.getElementById("stats");
const ctxGame = gameCanvas.getContext("2d");
const ctxStats = statsCanvas.getContext("2d");

let gameIntervalId;
let statsIntervalId;
let balls = [];
let player = new Ball(new Vector(0, 0), new Vector(0, 0), BALL_RADIUS);
let state = "ended";
let gameStartMillis;
let lastBallSpawnMillis;
let secondsSurvived = 0;

let ballColor;
let playerColor;
let textColor;

let f = new FontFace("Varela Round", "url(https://fonts.gstatic.com/s/varelaround/v19/w8gdH283Tvk__Lua32TysjIfp8uP.woff2)")

f.load().then(font => {
    document.fonts.add(font);
    loadTheme();
}, err => console.log(err));

let run = function() {
    update();
    drawGame();
}

function start() {
    state = "playing";
    for (let i = 1; i <= BALL_COUNT_INITIAL; i++) {
        spawnBall();
    }
    player.active = true;
    gameStartMillis = Date.now() + (BALL_SPAWN_WARMUP * 1000);
    gameIntervalId = setInterval(run, 1000 / 120);
    ctxStats.clearRect(0, 0, statsCanvas.width / 2, statsCanvas.height);
    setTimeout(() => {
        statsIntervalId = setInterval(drawStats, 1000);
    }, (BALL_SPAWN_WARMUP - 1) * 1000);
    Sound.MUSIC.loop();
}

function startEnd() {
    balls.push(player);
    state = "ending";
    secondsSurvived = Math.floor((Date.now() - gameStartMillis) / 1000);
    clearInterval(statsIntervalId);
}

function finishEnd() {
    clearInterval(gameIntervalId);
    balls = [];
    state = "ended";
    Sound.MUSIC.stop();
    checkHighscore(secondsSurvived);
    drawMenu();
    drawHighscore();
}

function update() {
    for (const ball of balls) {
        checkCollisions(ball);
    }
    for (const ball of balls) {
        ball.colliding = false;
        if (state === "ending") {
            ball.velocity = ball.velocity.add(new Vector(0, 0.1));
        }
        if (ball.active) {
            ball.move();
        }
    }
    if (state === "playing" && (Date.now() - lastBallSpawnMillis) / 1000 >= BALL_SPAWN_INTERVAL) {
        spawnBall();
    } else if (state === "ending") {
        let ballOnScreen = false;
        for (const ball of balls) {
            if (ball.position.y < gameCanvas.height + 400) {
                ballOnScreen = true;
                break;
            }
        }
        if (!ballOnScreen) {
            finishEnd();
        }
    }

}

function checkCollisions(ball) {
    if (state === "playing" && ball.hasCollided(player)) {
        player.velocity = ball.velocity.mult(-1);
        ball.collide(player);
        startEnd();
    }

    if (ball.position.x <= ball.radius) {
        ball.velocity = new Vector(Math.abs(ball.velocity.x), ball.velocity.y);
        ball.position = new Vector(ball.radius, ball.position.y);
        Sound.WALL.play();
    } else if (ball.position.x >= gameCanvas.width - ball.radius) {
        ball.velocity = new Vector(-Math.abs(ball.velocity.x), ball.velocity.y);
        ball.position = new Vector(gameCanvas.width - ball.radius, ball.position.y);
        Sound.WALL.play();
    } else if (ball.position.y <= ball.radius) {
        ball.velocity = new Vector(ball.velocity.x, Math.abs(ball.velocity.y))
        ball.position = new Vector(ball.position.x, ball.radius);
        Sound.WALL.play();
    } else if (state === "playing" && ball.position.y >= gameCanvas.height - ball.radius) {
        ball.velocity = new Vector(ball.velocity.x, -Math.abs(ball.velocity.y));
        ball.position = new Vector(ball.position.x, gameCanvas.height - ball.radius);
        Sound.WALL.play();
    }

    for (const collision of balls) {
        if (ball !== collision && ball.hasCollided(collision) && !collision.colliding) {
            ball.collide(collision);
        }
    }
}

function spawnBall() {
    const ball = new Ball(new Vector(Math.floor(Math.random() * (gameCanvas.width - 100)) + 50, 
            Math.floor(Math.random() * (gameCanvas.height - 100)) + 50), 
            new Vector(0, 0), BALL_RADIUS);
    balls.push(ball);
    lastBallSpawnMillis = Date.now();
    setTimeout(() => {
        let hypDistance = ball.distance(player);
        ball.velocity = new Vector(BALL_SPEED_INITIAL / hypDistance * (player.position.x - ball.position.x), 
                BALL_SPEED_INITIAL / hypDistance * (player.position.y - ball.position.y));
        ball.active = true;
        Sound.POP.play();
    }, BALL_SPAWN_WARMUP * 1000);
}

function drawGame() {
    if (state === "ended") return;
    ctxGame.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    ctxGame.lineWidth = 2;
    ctxGame.shadowColor = "black";
    ctxGame.shadowBlur = 1;
    ctxGame.shadowOffsetX = 1;
    ctxGame.shadowOffsetY = 1;

    for (const ball of balls) {
        ctxGame.beginPath();
        ctxGame.arc(ball.position.x, ball.position.y, ball.radius - 1, 0, Math.PI * 2, false);
        if (ball.active) {
            ctxGame.fillStyle = ballColor;
            ctxGame.fill();
            ctxGame.stroke();
        } else {
            ctxGame.fillStyle = "gray";
            ctxGame.fill();
        }
    }
    ctxGame.fillStyle = playerColor;
    ctxGame.beginPath();
    ctxGame.arc(player.position.x, player.position.y, player.radius - 1, 0, Math.PI * 2, false);
    ctxGame.fill();
    ctxGame.stroke();
    ctxGame.shadowColor = "black";
}

function drawStats() { 
    ctxStats.clearRect(0, 0, statsCanvas.width / 2, statsCanvas.height);
    ctxStats.textAlign = "center";
    ctxStats.font = "24px Varela Round";
    ctxStats.fillStyle = playerColor;
    ctxStats.fillText("Time", statsCanvas.width / 8, 40);
    ctxStats.fillText("Balls", 3 * statsCanvas.width / 8, 40);
    ctxStats.fillStyle = textColor;
    ctxStats.fillText(Math.floor((Date.now() - gameStartMillis) / 1000) + "s", statsCanvas.width / 8, 75);
    ctxStats.fillText(getBallCount(Math.floor((Date.now() - gameStartMillis) / 1000)), 3 * statsCanvas.width / 8, 75);
}

function drawHighscore() {
    ctxStats.clearRect(statsCanvas.width, 0, statsCanvas.width / 2, statsCanvas.height);
    ctxStats.textAlign = "center";
    ctxStats.font = "24px Varela Round";
    ctxStats.fillStyle = ballColor;
    ctxStats.fillText("Best Time", 5 * statsCanvas.width / 8, 39);
    ctxStats.fillText("Most Balls", 7 * statsCanvas.width / 8, 39);
    ctxStats.fillStyle = textColor;
    ctxStats.fillText(localStorage.getItem("hs") + "s", 5 * statsCanvas.width / 8, 73);
    ctxStats.fillText(getBallCount(parseInt(localStorage.getItem("hs"))), 7 * statsCanvas.width / 8, 73);
}

function drawMenu() {
    ctxGame.textAlign = "center";
    ctxGame.shadowColor = "rgba(0,0,0,0)";
    if (secondsSurvived > 0) {
        ctxGame.fillStyle = textColor;
        ctxGame.font = "bold 28px Varela Round";
        ctxGame.fillText("Game over!", gameCanvas.width / 2, 80);
    }
    ctxGame.font = 'bold 128px Varela Round';
    ctxGame.fillStyle = ballColor;
    ctxGame.lineWidth = 1;
    ctxGame.fillText("Balls", gameCanvas.width / 2, gameCanvas.height / 2 - 25);
    ctxGame.strokeText("Balls", gameCanvas.width / 2, gameCanvas.height / 2 - 25);
    ctxGame.font = "bold 48px Varela Round";
    ctxGame.fillStyle = playerColor;
    ctxGame.fillText("Click to Play", gameCanvas.width / 2, gameCanvas.height / 2 + 45);
    ctxGame.strokeText("Click to Play", gameCanvas.width / 2, gameCanvas.height / 2 + 45);
    ctxGame.font = "18px Varela Round";
    ctxGame.fillStyle = textColor;
    ctxGame.textAlign = "left";
    ctxGame.fillText("Created by Floomf", 16, gameCanvas.height - 40);
    ctxGame.fillText("Music by Spicyspaceman1", 16, gameCanvas.height - 16);
    ctxGame.textAlign = "right";
    ctxGame.fillText("Press C to Swap Themes", gameCanvas.width - 16, gameCanvas.height - 16);
}

function checkHighscore(score) {
    if (localStorage.getItem("hs") < secondsSurvived) {
        localStorage.setItem("hs", secondsSurvived);
        window.alert(`NEW HIGH SCORE!\n\nYou survived ${secondsSurvived} seconds and got to ${getBallCount(secondsSurvived)} balls!`);
    }
}

function getBallCount(secondsSurvived) {
    return Math.floor(secondsSurvived / BALL_SPAWN_INTERVAL) + BALL_COUNT_INITIAL;
}

function movePlayer(e) {
    const rect = gameCanvas.getBoundingClientRect();
    let x = e.clientX - rect.x;
    let y = e.clientY - rect.y;

    if (x < player.radius) {
        x = player.radius;
    } else if (x > gameCanvas.width - player.radius) {
        x = gameCanvas.width - player.radius;
    }

    if (y < player.radius) {
        y = player.radius;
    } else if (y > gameCanvas.height - player.radius) {
        y = gameCanvas.height - player.radius;
    }

    player.position = new Vector(x, y);
}

function swapTheme() {
    if (localStorage.getItem("theme") === "light") {
        localStorage.setItem("theme", "dark");
        document.body.classList.remove("light");
        gameCanvas.classList.remove("light");
        statsCanvas.classList.remove("light");
    } else {
        localStorage.setItem("theme", "light");
        document.body.classList.remove("dark");
        gameCanvas.classList.remove("dark");
        statsCanvas.classList.remove("dark");
    }
    loadTheme();
}

function loadTheme() {
    if (localStorage.getItem("theme") === "light") {
        textColor = Color.LIGHT_TEXT.value;
        ballColor = Color.LIGHT_BALL.value;
        playerColor = Color.LIGHT_PLAYER.value;
        document.body.classList.add("light");
        gameCanvas.classList.add("light");
        statsCanvas.classList.add("light");
    } else {
        textColor = Color.DARK_TEXT.value;
        ballColor = Color.DARK_BALL.value;
        playerColor = Color.DARK_PLAYER.value;
        document.body.classList.add("dark");
        gameCanvas.classList.add("dark");
        statsCanvas.classList.add("dark");
    }

    if (state === "ended") {
        drawMenu();
    } 
    if (state === "playing" || secondsSurvived > 0) { //TODO fix
        drawStats();
    }

    if (localStorage.getItem("hs") !== null) {
        drawHighscore();
    }
}

document.addEventListener("mousemove", e => {
    if (state === "playing") {
        movePlayer(e);
    }
});
document.getElementById("game").addEventListener("click", () => {
    if (state === "ended") {
        start();
    }
});
document.body.addEventListener("keypress", e => {
    if (e.key === "c") {
        swapTheme();
    }
});