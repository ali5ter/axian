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

