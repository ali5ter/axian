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

var sprites = {
    ship: { sx:32, sy:392, w:26, h:32, frames:0 },
    shipExplosion: { sx:60, sy:374, w:64, h:64, frames:4 },
    alien1: { sx:0, sy:0, w:24, h:24, frames:3 },
    alienExplosion: { sx:0, sy:336, w:32, h:32, frames:4 }
};

var startGame = function() {
    SpriteSheet.draw(Game.ctx, 'ship', 100, 100, 0);
    //SpriteSheet.draw(Game.ctx, 'shipExplosion', 100, 100, 0);
    //SpriteSheet.draw(Game.ctx, 'alien1', 100, 100, 2);
};

window.addEventListener('load', function() {
    Game.init('game', sprites, startGame);
});
