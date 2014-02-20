/*
   game.js
*/

var Game = new function() { // single instance

    var KEYS = { 37:'left', 39:'right', 32:'fire' };
    var boards = [];
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
        console.log('loop');
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

// @see spritecow.com to get positions of sprites from a sprite-sheet
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

var startGame = function() {
    SpriteSheet.draw(Game.ctx, 'ship', 0, 0, 0);
};

window.addEventListener('load', function() {
    Game.init('game', sprites, startGame);
});
