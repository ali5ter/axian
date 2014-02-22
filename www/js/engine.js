/*

   @file engine.js
   Game engine helper objects.
   Based on code from Pascal Retting's excellent book, 'Professional HTML5
   Mobile Game Development'

*/

/* ---------------------------------------------------------------------------
 *
 * @class SprintSheet
 * Wrapper to draw images from a sprite-sheet image to a canvas context
 *
 */

var SpriteSheet = new function() { // singleton

    this.map = {};  // list of mapping objects

    // Mapping object format:
    //  string_name_of_sprite : {
    //      sx: x offset in sprite sheet,
    //      sy: y offset in sprite sheet,
    //      w: width of sprite tile,
    //      h: height of sprite tile,
    //      frames: number of tiles used to animate this sprite (0-n)
    //  }
    // @see spritecow.com to discover offsets and dimensions in a sprite-sheet

    // @method load
    // Load sprite-sheet
    // @param myData Array of mapping objects
    // @param callback
    this.load = function(mapData, callback) {
        this.map = mapData;
        this.img = new Image();
        this.img.onload = callback;
        this.img.src = 'imgs/sprites.png';
    };

    // @method draw
    // Draw sprite to a canvas context
    // @param ctx canvas context
    // @param sprite string name of sprite
    // @param x sprite position on convas context in the x axis
    // @param y sprite position on convas context in the y axis
    // @param frame index of sprite tile to be drawn
    this.draw = function(ctx, sprite, x, y, frame) {
        var s = this.map[sprite];
        if (!frame) frame = 0;
        ctx.drawImage(this.img, s.sx + (frame * s.w), s.sy, s.w, s.h, x, y, s.w, s.h);
    };
}();

/* ---------------------------------------------------------------------------
 *
 * @class TitleScreen
 *
 */

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

/* ---------------------------------------------------------------------------
 *
 * @class GameBoard
 * Wrapper to draw images from a sprite-sheet image to a canvas context
 *
 */

var GameBoard = function() {

    var board = this;   // selfie

    this.objects = [];  // list of objects on the board
    this.count = [];    // list of object type counts
    this.removed = [];  // list of objects marked for removal

    // @method add
    // Add an object to the game board
    // @param obj game object that has at least a draw and step method
    this.add = function(obj) {
        obj.board = this;   // give the object its own reference to the board
        this.objects.push(obj);
        this.count[obj.type] = (this.count[obj.type] || 0) + 1;
        return obj;
    };

    // @method remove
    // Marks an object for removal from the game board
    // @param obj game object that has at least a draw and step method
    this.remove = function(obj) {
        var wasStillAlive = this.removed.indexOf(obj) != -1;
        if (wasStillAlive) this.removed.push(obj);
        return wasStillAlive; // return false if objects already removed (aka dead)
    };

    // @method resetRemoved
    // Empty the list o object to be removed
    this.resetRemoved = function() { this.removed = []; };

    // @method finalizeRemoved
    // Remove objects marked from removel from the game board
    this.finalizeRemoved = function() {
        for (var i = 0, len = this.removed.length; i < len; i++) {
            var _i = this.objects.indexOf(this.removed[i]);
            if (_i != -1) {
                this.count[this.removed[i].type]--;
                this.objects.splice(_i, 1);
            }
        }
    };

    // @method iterate
    // Call a method on all objects currently added to the game board
    // @param funcName function to call, e.g. draw, step
    this.iterate = function(funcName) {
        var args = Array.prototype.slice.call(arguments, 1); //?
        for (var i = 0, len = this.objects.length; i < len; i++) {
            var obj = this.objects[i];
            obj[funcName].apply(obj,args); //?
        }
    };

    // @method detect
    // Find first object in the game board for which the function return true
    // @param func function to pass each object to
    this.detect = function(func) {
        for (var i = 0, len = this.objects.length; i < len; i++) {
            if(func.call(this.objects[i])) return this.objects[i]; //?
        }
        return false;
    };

    // @method overlap
    // Check is two objects overlap
    // @param o1 an object with x,y and h,w properties
    // @param o2 an object with x,y and h,w properties
    this.overlap = function(o1, o2) {
        return !(
            (o1.y + o1.h -1 < o2.y) ||  // o1 bottom edge clear of o2 top edge?
            (o1.y > o2.y + o2.h -1) ||  // o1 top edge clear of o2 bottom edge?
            (o1.x + o1.w -1 < o2.x) ||  // o1 right edge clear of o2 left edge?
            (o1.x > o2.x + o2.w -1)     // o1 left edge clear of o2 right edge?
        );
    };

    // @method collide
    // Check an object is not overlapping any other objects in the game board
    // @param obj an object added to the game board
    // @param type object types that can collide with the given object, e.g.
    //  OBJECT_PLAYER | OBJECT_PLAYER_PROJECTILE
    //  where
    //  OBJECT_PLAYER = 1
    //  OBJECT_PLAYER_PROJECTILE = 2 (globals are power of 2 to allow for AND op)
    this.collide = function(obj, type) {
        return this.detect(function() {
            if (obj != this) {
                var col = (!type || this.type & type) && board.overlap(obj, this);
                return col ? this : false;
            }
        });
    };


    // @method step
    // Call step method on all objects added to the game board. Remove any
    // objects on the game board that are marked for removal.
    // @param dt time since last loop
    this.step = function(dt) {
        this.resetRemoved();
        this.iterate('step', dt);
        this.finalizeRemoved();
    };

    // @method draw
    // Call draw method on all objects added to the game board
    // @param ctx canvas context
    this.draw = function(ctx) {
        this.iterate('draw', ctx);
    };
};
