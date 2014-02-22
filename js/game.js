/*
   game.js
*/

var Game = new function() { // singleton

    var KEYS = { 37:'left', 39:'right', 32:'fire' },
        boards = [];
    this.keys = {};

    this.init = function(canvasId, spriteData, callback) {
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if (!this.ctx) { return alert('No canvas available with this browser'); }
        this.setupInput();
        this.loop();
        SpriteSheet.load(spriteData, callback);
    };

    this.setupInput = function() {
        window.addEventListener('keydown', function(e) {
            if (KEYS[e.keyCode]) {
                Game.keys[KEYS[e.keyCode]] = true;
                e.preventDefault();
            }
        }, false);
        window.addEventListener('keyup', function(e) {
            if (KEYS[e.keyCode]) {
                Game.keys[KEYS[e.keyCode]] = false;
                e.preventDefault();
            }
        }, false);
    };

    this.loop = function() {
        var dt = 30/1000,   // 30 milliseconds
            i = 0,
            len = boards.length;
        for (i=0; i<len; i++) {
            if (boards[i]) {
                boards[i].step(dt);
                boards[i] && boards[i].draw(Game.ctx);
            }
        }
        setTimeout(Game.loop, 30);
    };

    this.setBoard = function(zIndex, board) { boards[zIndex] = board; };
}();

var sprites = {
        ship: { sx:238, sy:62, w:26, h:40, frames:1 },
        shipExplosion: { sx:0, sy:340, w:64, h:64, frames:3 },
        shipMissile: { sx:238, sy:34, w:2, h:8, frames:0 },
        alien1: { sx:0, sy:0, w:24, h:24, frames:2 },
        alien1RollLeft: { sx:0, sy:24, w:24, h:24, frames:8 },
        alien1RollRight: { sx:0, sy:48, w:24, h:24, frames:8 },
        alien2: { sx:0, sy:72, w:24, h:24, frames:2 },
        alien2RollLeft: { sx:0, sy:96, w:24, h:24, frames:8 },
        alien2RollRight: { sx:0, sy:120, w:24, h:24, frames:8 },
        alien3: { sx:0, sy:144, w:24, h:24, frames:0 },
        alien3RollLeft: { sx:0, sy:168, w:24, h:24, frames:8 },
        alien3RollRight: { sx:0, sy:192, w:24, h:24, frames:8 },
        alienExplosion: { sx:0, sy:306, w:34, h:34, frames:3 },
        alienMissile: { sx:242, sy:34, w:2, h:8, frames:0 },
        life: { sx:322, sy:80, w:18, h:22, frames:0 },
        flag: { sx:272, sy:80, w:14, h:22, frames:0 }
    };

var StarField = function(speed, opacity, numStars, clear) {

    var stars = document.createElement('canvas'); // offscreen canvas
    stars.width = Game.width;
    stars.height = Game.height;
    var starsCtx = stars.getContext('2d');
    var offset = 0;

    if (clear) {    // clear for non-transparent canvas
        starsCtx.fillStyle = '#000';
        starsCtx.fillRect(0, 0, stars.width, stars.height);
    }

    starsCtx.globalAlpha = opacity;
    var r = function (max, min) {
        if (!min) min = 0;
        return Math.floor(Math.random()*(max-min)+min);
    };
    for (var i = 0; i < numStars; i++) { // draw stars
        starsCtx.fillStyle = 'rgb('+ r(256) +','+  r(256) +','+ r(256) +')';
        starsCtx.fillRect(r(stars.width), r(stars.height), 2, 2);
    }

    this.draw = function(ctx) {
        var intOffset = Math.floor(offset);
        var remaining = stars.height - intOffset;
        if (intOffset > 0) { // top half of starfield
            ctx.drawImage(
                stars,
                0, remaining,
                stars.width, intOffset,
                0, 0,
                stars.width, intOffset);
        }
        if (remaining > 0) { // bottom half of starfield
            ctx.drawImage(
                stars,
                0, 0,
                stars.width, remaining,
                0, intOffset,
                stars.width, remaining);
        }
    };

    this.step = function(dt) {
        offset += dt * speed;           // distance moved in loop step time
        offset = offset % stars.height; // adjust offset to canvas height
    };
};

var PlayerShip = function() {
    this.w = SpriteSheet.map.ship.w;
    this.h = SpriteSheet.map.ship.h;
    this.x = Game.width/2 - this.w/2;
    this.y = Game.height - 30 - this.h;
    this.vx = 0;
    this.maxVel = 200;
    this.reloadTime = 0.25;
    this.reload = this.reloadTime;

    this.draw = function(ctx) {
        SpriteSheet.draw(ctx, 'ship', this.x, this.y, this.reload < 0 ? 1 : 0);
    };

    this.step = function(dt) {
        if (Game.keys.left) this.vx = -this.maxVel;
        else if (Game.keys.right) this.vx = this.maxVel;
        else this.vx = 0;

        this.x += this.vx * dt;

        if (this.x < 0) this.x = 0;
        else if(this.x > Game.width - this.w) this.x = Game.width - this.w;

        // TODO: Perhaps reload when missile off screen or collides
        this.reload -= dt;
        if (Game.keys.fire && this.reload < 0) {
            Game.keys.fire = false;
            this.reload = this.reloadTime;
            this.board.add(new PlayerMissile(this.x + this.w/2, this.y));
        }
    };
};

var PlayerMissile = function(x, y) {
    this.w = SpriteSheet.map.shipMissile.w;
    this.h = SpriteSheet.map.shipMissile.h;
    this.x = x - this.w/2;
    this.y = y - this.h;
    this.vy = -700;
};

PlayerMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;
    if (this.y < - this.h) { this.board.remove(this); }
};

PlayerMissile.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx, 'shipMissile', this.x, this.y);
};

var Lives = function() {
    this.w = SpriteSheet.map.life.w;
    this.h = SpriteSheet.map.life.h;
    this.x = 0;
    this.y = Game.height - this.h;
    this.remaining = 2;

    this.draw = function(ctx) {
        for (var i = 0; i < this.remaining; i++) {
            SpriteSheet.draw(ctx, 'life', (this.w+8)*i, this.y, 0);
        }
    };

    this.step = function(dt) {
        //TODO: anything to do?
    };

};

var startGame = function() {
    Game.setBoard(0, new StarField(20, 0.4, 80, true));
    Game.setBoard(1, new StarField(50, 0.6, 40));
    Game.setBoard(2, new StarField(100, 1.0, 10));
    Game.setBoard(3, new TitleScreen('Axian', 'Fire to start playing', playGame));
};

var playGame = function() {
    var board = new GameBoard();

    board.add(new PlayerShip());

    Game.setBoard(3, board);
    Game.setBoard(4, new Lives(2));
};

window.addEventListener('load', function() {
    Game.init('game', sprites, startGame);
});
