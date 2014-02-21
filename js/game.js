/*
   game.js
*/

var Game = new function() { // single instance

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
        ship: { sx:238, sy:70, w:26, h:32, frames:0 },
        shipExplosion: { sx:0, sy:340, w:64, h:64, frames:3 },
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
        life: { sx:288, sy:80, w:18, h:22, frames:0 },
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
        return Math.floor(Math.random()*(max-min)+min);i
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

var startGame = function() {
    Game.setBoard(0, new StarField(20, 0.3, 100, true));
    Game.setBoard(1, new StarField(50, 0.6, 60));
    Game.setBoard(3, new StarField(100, 1.0, 40));
};

window.addEventListener('load', function() {
    Game.init('game', sprites, startGame);
});
