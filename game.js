const BALL_SPAWN_WARMUP = 2;
const BALL_SPAWN_INTERVAL = 20;
const BALL_RADIUS = 20;
const BALL_COUNT_INITIAL = 4;
const BALL_SPEED_INITIAL = 3;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let intervalId;
let balls = [];
let player = new Ball(new Vector(0, 0), new Vector(0, 0), BALL_RADIUS);
let state = "ended";
let gameStartMillis;
let lastBallSpawnMillis;
let secondsSurvived;

let ballColor;
let playerColor;
let textColor;

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
    intervalId = setInterval(run, 1000 / 120);
    Sound.MUSIC.loop();
}

function startEnd() {
    balls.push(player);
    state = "ending";
    secondsSurvived = Math.floor((Date.now() - gameStartMillis) / 1000);
}

function finishEnd() {
    clearInterval(intervalId);
    balls = [];
    state = "ended";
    Sound.MUSIC.stop();
    checkHighscore(secondsSurvived);
    drawMenu();
    drawResults();
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
            if (ball.position.y < canvas.height + 400) {
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
    } else if (ball.position.x >= canvas.width - ball.radius) {
        ball.velocity = new Vector(-Math.abs(ball.velocity.x), ball.velocity.y);
        ball.position = new Vector(canvas.width - ball.radius, ball.position.y);
        Sound.WALL.play();
    } else if (ball.position.y <= ball.radius) {
        ball.velocity = new Vector(ball.velocity.x, Math.abs(ball.velocity.y))
        ball.position = new Vector(ball.position.x, ball.radius);
        Sound.WALL.play();
    } else if (state === "playing" && ball.position.y >= canvas.height - ball.radius) {
        ball.velocity = new Vector(ball.velocity.x, -Math.abs(ball.velocity.y));
        ball.position = new Vector(ball.position.x, canvas.height - ball.radius);
        Sound.WALL.play();
    }

    for (const collision of balls) {
        if (ball !== collision && ball.hasCollided(collision) && !collision.colliding) {
            ball.collide(collision);
        }
    }
}

function spawnBall() {
    const ball = new Ball(new Vector(Math.floor(Math.random() * (canvas.width - 100)) + 50, 
            Math.floor(Math.random() * (canvas.height - 100)) + 50), 
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    for (const ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.position.x, ball.position.y, ball.radius - 1, 0, Math.PI * 2, false);
        if (ball.active) {
            ctx.fillStyle = ballColor;
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = "gray";
            ctx.fill();
        }
    
    }
    ctx.fillStyle = playerColor;
    ctx.beginPath();
    ctx.arc(player.position.x, player.position.y, player.radius - 1, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.stroke();
}

function drawMenu() {
    ctx.textAlign = "center";
    ctx.font = "bold 120px sans-serif";
    ctx.fillStyle = ballColor;
    ctx.lineWidth = 1;
    ctx.fillText("Balls", canvas.width / 2, canvas.height / 2 - 25, canvas.width);
    ctx.strokeText("Balls", canvas.width / 2, canvas.height / 2 - 25, canvas.width);
    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = playerColor;
    ctx.fillText("Click to Play", canvas.width / 2, canvas.height / 2 + 45, canvas.width);
    ctx.strokeText("Click to Play", canvas.width / 2, canvas.height / 2 + 45, canvas.width);
    ctx.font = "15px sans-serif";
    ctx.fillStyle = textColor;
    ctx.fillText("(Press C to Swap Themes)", canvas.width / 2, canvas.height / 2 + 80, canvas.width);

}

function drawResults() {
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Game over!", canvas.width / 2, 40);
    ctx.font = "20px sans-serif";
    ctx.fillText(`Time alive: ${secondsSurvived}s (${getBallCount(secondsSurvived)} balls)`, 
            canvas.width / 2, 70);
}

function drawHighscore() {
    ctx.fillStyle = textColor;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Your Best:", canvas.width / 2, canvas.height - 60);
    ctx.font = "20px sans-serif";
    ctx.fillText(`${localStorage.getItem("hs")}s (${getBallCount(localStorage.getItem("hs"))} balls)`, 
            canvas.width / 2, canvas.height - 30);
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
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.x;
    let y = e.clientY - rect.y;

    if (x < player.radius) {
        x = player.radius;
    } else if (x > canvas.width - player.radius) {
        x = canvas.width - player.radius;
    }

    if (y < player.radius) {
        y = player.radius;
    } else if (y > canvas.height - player.radius) {
        y = canvas.height - player.radius;
    }

    player.position = new Vector(x, y);
}

function swapTheme() {
    if (localStorage.getItem("theme") === "light") {
        localStorage.setItem("theme", "dark");
        document.body.classList.remove("light");
        canvas.classList.remove("light");
    } else {
        localStorage.setItem("theme", "light");
        document.body.classList.remove("dark");
        canvas.classList.remove("dark");
    }
    loadTheme();
}

function loadTheme() {
    if (localStorage.getItem("theme") === "light") {
        textColor = Color.LIGHT_TEXT.value;
        ballColor = Color.LIGHT_BALL.value;
        playerColor = Color.LIGHT_PLAYER.value;
        document.body.classList.add("light");
        canvas.classList.add("light");
    } else {
        textColor = Color.DARK_TEXT.value;
        ballColor = Color.DARK_BALL.value;
        playerColor = Color.DARK_PLAYER.value;
        document.body.classList.add("dark");
        canvas.classList.add("dark");
    }

    if (state === "ended") {
        drawMenu();
        if (secondsSurvived !== undefined) {
            drawResults();
        }
        if (localStorage.getItem("hs") !== null) {
            drawHighscore();
        }
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

loadTheme();
drawMenu();
if (localStorage.getItem("hs") !== null) {
    drawHighscore();
}
