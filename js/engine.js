/*
   engine.js
*/

var SpriteSheet = new function() { // single instance

    this.map = {};

    this.load = function(mapData, callback) {
        this.map = mapData;
        this.img = new Image();
        this.img.onload = callback;
        this.img.src = 'imgs/sprites.png';
    };

    this.draw = function(ctx, sprite, x, y, frame) {
        var s = this.map[sprite];
        if (!frame) frame = 0;
        ctx.drawImage(this.img, s.sx + (frame * s.w), s.sy, s.w, s.h, x, y, s.w, s.h);
    };
}();

var TitleScreen = function(title, subtitle, callback) {

    this.draw = function(ctx) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '40px virgo_01regular';
        ctx.fillText(title, Game.width/2, Game.height/2);
        ctx.font = '20px virgo_01regular';
        ctx.fillText(subtitle, Game.width/2, Game.height/2 + 40);
    };

    this.step = function(dt) {
        if (Game.keys.fire && callback) callback();
    };
};
