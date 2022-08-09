class Vector {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    mult(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    }

    div(scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}

class Ball {
    position;
    velocity;
    radius;
    colliding = false;
    active = false;

    constructor(position, velocity, radius) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
    }

    move() {
        this.position = this.position.add(this.velocity);
    }

    distance(other) {
        return Math.sqrt((this.position.x - other.position.x) ** 2 + (this.position.y - other.position.y) ** 2);
    }

    hasCollided(other) {
        return this.active && other.active && this.distance(other) < this.radius + other.radius;
    }

    correctOverlap(other) {
        const distanceBetween = this.distance(other)

        const overlap = this.radius + other.radius - distanceBetween;
        const xOverlap = (overlap / distanceBetween) * Math.abs(this.position.x - other.position.x);
        const yOverlap = (overlap / distanceBetween) * Math.abs(this.position.y - other.position.y);

        if (this.position.x > other.position.x) {
            this.position = this.position.add(new Vector(xOverlap / 2, 0));
            other.position = other.position.add(new Vector(-xOverlap / 2, 0));
        } else {
            this.position = this.position.add(new Vector(-xOverlap / 2, 0));
            other.position = other.position.add(new Vector(xOverlap / 2, 0));
        }

        if (this.position.y > other.position.y) {
            this.position = this.position.add(new Vector(0, yOverlap / 2));
            other.position = other.position.add(new Vector(0, -yOverlap / 2));
        } else {
            this.position = this.position.add(new Vector(0, -yOverlap / 2));
            other.position = other.position.add(new Vector(0, yOverlap / 2));
        }
    }

    collide(other) {
        //console.log("Colliding" + this + " and " + other);
        Sound.COLLIDE.play();
        this.colliding = true;
        other.colliding = true;
        this.correctOverlap(other);
        let collision = other.position.sub(this.position);
        let distance = collision.length();

        collision = collision.div(distance);

        let aci = this.velocity.dot(collision);
        let bci = other.velocity.dot(collision);

        this.velocity = this.velocity.add(collision.mult(bci - aci));
        other.velocity = other.velocity.add(collision.mult(aci - bci));
    }

}

class Sound {
    static COLLIDE = new Sound("collide.wav");
    static WALL = new Sound("wall.wav");
    static POP = new Sound("pop.wav");
    static MUSIC = new Sound("music.wav");

    constructor(file) {
        this.file = file;
        this.audio = new Audio("audio/" + file);
    }

    play() {
        this.audio.currentTime = 0;
        this.audio.play();
    }

    loop() {
        this.audio.addEventListener('ended', function() {
            this.play();
        }, false);
        this.play();
    }

    stop() {
        this.audio.pause();
    }

}