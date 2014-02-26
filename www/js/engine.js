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
 * @class Sprite
 * Definition of a series of one or many images from the sprite-sheet that
 * create a controllable object on a game board.
 *
 */

var Sprite = function() {
};

// @method setup
// Load the sprite description and properties
// @param sprite string name of the sprite
// @param props property object
Sprite.prototype.setup = function(sprite, props) {
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.hold = this.hold || 0;
    this.health = this.health || 0;
    this.w = SpriteSheet.map[sprite].w;
    this.h = SpriteSheet.map[sprite].h;
    this.subFrame = 0;
    this.frames = SpriteSheet.map[sprite].frames;
};

// @method merge
// Merge the property object with the sprite properties
// @param props property object
Sprite.prototype.merge = function(props) {
    if (props) {
        for (var prop in props) this[prop] = props[prop];
    }
};

// @method hit
// Default action when something collides with this sprite
// @param damage amount of damage done
Sprite.prototype.hit = function(damage) {
    this.health -= damage;
    if (this.health <=0) {
        if (this.board.remove(this)) {
            Game.points += this.points || 100;
            this.board.add(new Explosion(this.type, this.x + this.w/2, this.y + this.h/2));
        }
    }
};

// @method draw
// Draw sprite to a canvas context
// @param ctx canvas context
Sprite.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
};

/* ---------------------------------------------------------------------------
 *
 * @class TitleScreen
 * Simple board to show the title screen
 * @param title game title text string
 * @param title game subtitle text string, e.g. press fire to start
 * @param callback when fire key pressed
 *
 */

var TitleScreen = function(title, subtitle, callback) {

    // @method draw
    // Render title and subtitle on the canvas context
    // @param ctx canvas context
    this.draw = function(ctx) {
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '80px virgo';
        ctx.fillText(title, Game.width/2, Game.height/2);
        ctx.fillStyle = '#3fd9dd';
        ctx.font = '14px joystix';
        ctx.fillText(subtitle, Game.width/2, Game.height/2 + 40);
    };

    // @method step
    // Check if fire key pressed
    // @param dt time since last loop
    this.step = function(dt) {
        if (Game.keys.fire && callback) callback();
    };
};

/* ---------------------------------------------------------------------------
 *
 * @class GamePoints
 * Simple board to display the 1 up score and high score
 *
 */

var GamePoints = function() {

    // @method draw
    // Render scores to the canvas context
    // @param ctx canvas context
    this.draw = function(ctx) {
        var text = ''+ Game.points; // to string
        ctx.save(); // ?
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = '14px joystix';
        ctx.fillText('Hi score', Game.width/2, 14);
        ctx.textAlign = 'left';
        ctx.fillText('1up', 0, 14);
        ctx.fillStyle = '#c02b0e';
        ctx.textAlign = 'center';
        ctx.fillText(Game.highscore, Game.width/2, 28);
        ctx.textAlign = 'left';
        ctx.fillText(Game.points, 0, 28);
        ctx.restore(); // ?
    };

    // @method step
    // Dummy step method
    // @param dt time since last loop
    this.step = function(dt) {
        if (Game.points > Game.highscore) Game.highscore = Game.points;
    };
};

/* ---------------------------------------------------------------------------
 *
 * @class GameBoard
 * A board to draw images from a sprite-sheet image
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
        var stillAlive = this.removed.indexOf(obj) == -1;
        if (stillAlive) this.removed.push(obj);
        return stillAlive;
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
    // Check is two objects, not already marked for removal, overlap
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
                var col = (!type || this.type & type) &&        // a type we want?
                    board.overlap(obj, this);                   // overlapping?
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

/* ---------------------------------------------------------------------------
 *
 * @class Level
 * Parses level data to stage the generation of enemies on teh game board
 *
 */

var Level = function(levelData, callback) {
    this.levelData = [];
    for (var i = 0; i <levelData.length; i++) {
        this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callback;
};

// @method step
// Add enemy sprites as they are defined to appear in the level data
// @param dt time since last loop
Level.prototype.step = function(dt) {
    var _i = 0,
        _remove = [],
        _cObj = null;
    this.t += dt * 1000;    // time offset

    // var level1 = [
    //    Start   End     Gap     Type        Override
    //    [0,     4000,   500,    'step',     { x: 100 } ],
    while ((_cObj = this.levelData[_i]) && (_cObj[0] < this.t + 2000)) {
        if (this.t > _cObj[1]) {
            _remove.push(_cObj); // remove if past the end
        }
        else if (_cObj[0] < this.t) {
            this.board.add(new Enemy(enemies[_cObj[3]], _cObj[4])); // add sprite
            _cObj[0] += _cObj[2];   // increment start by gap
        }
        _i++;
    }

    // Remove past objects
    for (var i = 0; i < _remove.length; i++) {
        _i = this.levelData.indexOf(_remove[i]);
        if(_i != -1) this.levelData.splice(_i, 1);
    }

    // Check if level done
    if (this.levelData.length === 0 && this.board.count[OBJECT_ENEMY] === 0) {
        if (this.callback) this.callback();
    }
};

// @method draw
// Dummy method
// @param ctx canvas context
Level.prototype.draw = function(ctx) {
};
