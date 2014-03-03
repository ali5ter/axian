/*

   @file game.js
   Axian game
   Based on code from Pascal Retting's excellent book, 'Professional HTML5
   Mobile Game Development'

*/

/* ---------------------------------------------------------------------------
 *
 * @class Game
 * Main class to run this game
 *
 */

var Game = new function() { // singleton

    var KEYS = { 37:'left', 39:'right', 32:'fire' },
        boards = [];    // list of board layers to render on the canvas
    this.keys = {};     // object containing key button status
    this.points = 0;
    this.highscore = 0; // TODO: Store in local storage
    this.lives = 0;
    this.levels = 1;

    // @method init
    // Set up canvas, key bindings, load sprite sheet and start animation loop
    // @param canvasId canvas id attribute string value
    // @param sprites Object of sprite mapping objects
    // @param types Object of game board types
    // @param callback once sprite sheet image has loaded
    this.init = function(canvasId, sprites, types, callback) {
        this.canvas = document.getElementById(canvasId);
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
        if (!this.ctx) { return alert('No canvas available with this browser'); }
        this.setupInput();
        this.loop();
        this.types = types;
        SpriteSheet.load(sprites, callback);
    };

    // @method setupInput
    // Record keydown/keyup events when the correct keys pressed
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

    // @method loop
    // Main animation loop
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

    // @method setBoard
    // Add a board to the game board array
    // @param zIndex index of where the board sits in the stack
    // @param board the board object that should contain at least a draw and
    //        step method
    this.setBoard = function(zIndex, board) { boards[zIndex] = board; };

    // @Method removeBoard
    // Remove a board from the game board array
    // @param zIndex index of where the board sits in the stack
    this.removeBoard = function(zIndex) { boards.splice(zIndex, 1); };
}();

/* ---------------------------------------------------------------------------
 *
 * @class Starfield
 * A board to render a star field. This creates an off screen canvas of
 * randomly drawn rectangles which will scroll down the main game canvas
 * @param speed rate of downward scroll
 * @param opacity of canvas objects
 * @param numStars number of rectangles drawn on the canvas
 * @param clear boolean indicating non-transparent canvas
 *
 */

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

    // @method draw
    // Draw off-screen canvas to the game canvas context
    // @param ctx canvas context
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

    // @method step
    // Loop step method to update offset from which off-screen canvas should
    // be draw onto the game canvas
    // @param dt time since last loop
    this.step = function(dt) {
        offset += dt * speed;           // distance moved in loop step time
        offset = offset % stars.height; // adjust offset to canvas height
    };
};

/* ---------------------------------------------------------------------------
 *
 * @class Lives
 * A board to render remaining player ship lives
 *
 */

var Lives = function() {
    this.w = SpriteSheet.map.life.w;
    this.h = SpriteSheet.map.life.h;
    this.x = 3;
    this.y = Game.height - this.h - 5;
    this.wave = 4;  // 1 wave = 4 levels

    this.draw = function(ctx) {
        for (var i = 0; i < Game.lives-1; i++) {
            SpriteSheet.draw(ctx, 'life', this.x+(this.w+8)*i, this.y, 0);
        }
        for (i = 0; i < Math.ceil(Game.levels/this.wave)+1; i++) {
            SpriteSheet.draw(ctx, 'flag', Game.width+8-(this.w+8)*i, this.y, 0);
        }
    };

    this.step = function(dt) {
    };

};

/* ---------------------------------------------------------------------------
 *
 * @class PlayerShip
 * The players ship sprite
 *
 */

var PlayerShip = function() {
    this.setup('ship', { vx:0, frame:1, reloadTime:0.25, maxVel:200 });
    this.type = Game.types.OBJECT_PLAYER;
    this.x = Game.width/2 - this.w/2;
    this.y = Game.height - 30 - this.h;
    this.reload = this.reloadTime;

    // @method step
    // Loop step method to update ship position based on key status and
    // collision with edges of canvas. Also handles fire button binding to
    // add a new missile sprite to the game board
    // @param dt time since last loop
    this.step = function(dt) {
        if (Game.keys.left) this.vx = -this.maxVel;
        else if (Game.keys.right) this.vx = this.maxVel;
        else this.vx = 0;
        this.x += this.vx * dt;
        if (this.x < 0) this.x = 0;
        else if(this.x > Game.width - this.w) this.x = Game.width - this.w;

        // TODO: Perhaps reload when missile off screen or collides
        this.reload -= dt;
        this.frame = this.reload < 0 ? 1 : 0;
        if (Game.keys.fire && this.reload < 0) {
            Game.keys.fire = false;
            this.reload = this.reloadTime;
            this.board.add(new PlayerMissile(this.x + this.w/2, this.y));
        }
    };

    // @method hit
    // Override action when something collides with this sprite
    // @param damage amount of damage done
    this.hit = function(damage) {
        console.log('ship was hit');
        if (this.board.remove(this)) {
            console.log('removed ship from board');
            Game.lives -= 1;
            this.board.add(new Explosion(this.type, this.x + this.w/2,
                this.y + this.h/2, this.newShip));
        }
    };

    // @method newShip
    // Check that we have enough lives for a new ship
    this.newShip = function() {
        if (Game.lives > 0) this.board.add(new PlayerShip());
    };
};

PlayerShip.prototype = new Sprite();

/* ---------------------------------------------------------------------------
 *
 * @class PlayerMissile
 * The players ship missile sprite
 *
 */

var PlayerMissile = function(x, y) {
    this.setup('shipMissile', { vy:-700, damage:10 });
    this.type = Game.types.OBJECT_PLAYER_PROJECTILE;
    this.x = x - this.w/2;
    this.y = y - this.h;
};

PlayerMissile.prototype = new Sprite();

PlayerMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;
    // return the first enemy sprit object this missile hits
    var collision = this.board.collide(this, Game.types.OBJECT_ENEMY);
    if (collision) {
        collision.hit(this.damage); // hit sprite deals with collision
        this.board.remove(this);    // remove this missle
    }
    else if (this.y < - this.h) this.board.remove(this);
};

/* ---------------------------------------------------------------------------
 *
 * @class Enemy
 * An enemy sprite
 *
 */

var Enemy = function(blueprint, override) {
    this.merge(this.baseParms);
    this.setup(blueprint.sprite, blueprint);
    this.type = Game.types.OBJECT_ENEMY;
    this.merge(override);
};

Enemy.prototype = new Sprite();

Enemy.prototype.baseParms = { A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, t:0,
    firePercentage: 0.001, reloadTime: 5, reload: 0 };

Enemy.prototype.step = function(dt) {
    // vx = A + B * sin(C * t + D)
    // A = constant horizonal velocity
    // B = strength of horizonal sinusoidal velocity
    // C = period of horizonal sinusoidal velocity
    // D = time shift of horizonal sinusoidal velocity
    //
    // vy = E + F * sin(G * t + H)
    // E = constant vertical velocity
    // F = strength of vertical sinusoidal velocity
    // G = period of vertical sinusoidal velocity
    // H = time shift of vertical sinusoidal velocity
    this.t += dt;
    this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
    this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    var collision = this.board.collide(this, Game.types.OBJECT_PLAYER);
    if (collision) collision.hit(this.damage);
    // fire missile
    if (this.reload <= 0 && Math.random() < this.firePercentage) {
        this.reload = this.reloadTime;
        if (this.missiles == 2) {
            this.board.add(new EnemyMissile(this.x+this.w-2, this.y+this.h/2));
            this.board.add(new EnemyMissile(this.x+2, this.y+this.h/2));
        }
        else this.board.add(new EnemyMissile(this.x+this.w/2, this.y+this.h/2));
    }
    this.reload -= dt;
    // edge detection
    if (this.y > Game.height) this.y = 0;           // wrap bottom to top
    else if (this.x < -this.w) this.x = Game.width; // wrap left to right
    else if (this.x > Game.width) this.x = -this.w; // wrap right to left
    // cycle the sprite frames
    this.frame = Math.floor(this.subFrame++ / this.hold);
    if (this.subFrame >= this.frames * this.hold) this.subFrame = 0;
};

/* ---------------------------------------------------------------------------
 *
 * @class EnemyMissile
 * An enemy ship missile sprite
 *
 */

var EnemyMissile = function(x, y) {
    this.setup('alienMissile', { vy:200, damage:10 });
    this.type = Game.types.OBJECT_ENEMY_PROJECTILE;
    this.x = x - this.w/2;
    this.y = y - this.h;
};

EnemyMissile.prototype = new Sprite();

EnemyMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;
    var collision = this.board.collide(this, Game.types.OBJECT_PLAYER);
    if (collision) {
        collision.hit(this.damage); // hit sprite deals with collision
        this.board.remove(this);    // remove this missle
    }
    else if (this.y > Game.height) this.board.remove(this);
};

/* ---------------------------------------------------------------------------
 *
 * @class Explosion
 * An explosion sprite
 * @param type object type of the sprite to explode
 * @param cX center x coordinate
 * @param cY center y coordinate
 * @param callback when explosion ended
 *
 */

var Explosion = function(type, cX, cY, callback) {
    if (type === Game.types.OBJECT_PLAYER)  this.setup('shipExplosion', { hold:5 });
    else this.setup('alienExplosion', { hold:3 });
    this.type = type;
    this.x = cX - this.w/2;
    this.y = cY - this.h/2;
    this.callback = callback;
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
    this.frame = Math.floor(this.subFrame++ / this.hold);
    if (this.subFrame >= this.frames * this.hold) {
        this.board.remove(this);
        if (this.callback) this.callback();
    }
};

/* starts here -------------------------------------------------------------- */

(function() {

    var PI = Math.PI,
        TAU = PI*2,
        HPI = PI/2;

    // Sprite object types used on the game board

    var types = {
            OBJECT_PLAYER: 1,
            OBJECT_PLAYER_PROJECTILE: 2,
            OBJECT_ENEMY: 4,
            OBJECT_ENEMY_PROJECTILE: 8,
            OBJECT_POWERUP: 16
        }

    // Sprite object mappings

    var sprites = {
            ship: { sx:238, sy:62, w:26, h:40, frames:2 },
            shipExplosion: { sx:0, sy:340, w:64, h:64, frames:4 },
            shipMissile: { sx:238, sy:34, w:2, h:8, frames:1 },
            alien1: { sx:0, sy:0, w:24, h:24, frames:3, hold:10 },
            alien1RollLeft: { sx:0, sy:24, w:24, h:24, frames:9 },
            alien1RollRight: { sx:0, sy:48, w:24, h:24, frames:9 },
            alien2: { sx:0, sy:72, w:24, h:24, frames:3 },
            alien2RollLeft: { sx:0, sy:96, w:24, h:24, frames:9 },
            alien2RollRight: { sx:0, sy:120, w:24, h:24, frames:9 },
            alien3: { sx:0, sy:144, w:24, h:24, frames:3 },
            alien3RollLeft: { sx:0, sy:168, w:24, h:24, frames:9 },
            alien3RollRight: { sx:0, sy:192, w:24, h:24, frames:9 },
            alien4: { sx:0, sy:216, w:24, h:24, frames:0 },
            alien4RollLeft: { sx:0, sy:240, w:24, h:24, frames:12 },
            alien4RollRight: { sx:0, sy:264, w:24, h:24, frames:12 },
            alienExplosion: { sx:0, sy:306, w:34, h:34, frames:4 },
            alienMissile: { sx:242, sy:34, w:2, h:8, frames:1 },
            life: { sx:322, sy:80, w:18, h:22, frames:1 },
            flag: { sx:306, sy:80, w:14, h:22, frames:1 }
        };

    // Enemy behaviours

    var enemies = {
        straight:   { x:0, y:-50, sprite:'alien1', damage:1, health:10, hold:20,
                      E:100 },
        ltr:        { x:0, y:-100, sprite:'alien1', damage:1, health:10, hold:20,
                      B:200, C:1, E:200 },
        circle:     { x:400, y:-50, sprite:'alien4', damage:1, health:10, hold:20,
                      A:0, B:-200, C:1, E:20, F:200, G:1, H:HPI },
        wiggle:     { x:100, y:-50, sprite:'alien3', damage:1, health:20, hold:20,
                      B:100, C:4, E:100 },
        step:       { x:0, y:-50, sprite:'alien2', damage:1, health:10, hold:20,
                      B:100, C:1.5, E:60 },
        aaa:        { x:0, y:0, sprite:'alien1', damage:1, health:10, hold:20,
                      A:0, B:22, C:1, D:HPI, E:5, F:0, G:0, H:0 },
        bbb:        { x:0, y:0, sprite:'alien2', damage:1, health:10, hold:20,
                      A:0, B:22, C:1, D:HPI, E:5, F:0, G:0, H:0 },
        ccc:        { x:0, y:0, sprite:'alien3', damage:1, health:10, hold:20,
                      A:0, B:22, C:1, D:HPI, E:5, F:0, G:0, H:0 },
        ddd:        { x:0, y:0, sprite:'alien4', damage:1, health:10, hold:20,
                      A:0, B:22, C:1, D:HPI, E:5, F:0, G:0, H:0 },
    };

    // Level definitions

    var xo = 25, w = 30, yo = 180, h = w;

    var level1 = [
        //  Start   End     Gap     Type        Override
        [0,     4000,   4000,    'aaa',      { x: xo + w * 0, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 1, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 2, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 3, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 4, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 5, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 6, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 7, y: yo - h * 0 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 8, y: yo - h * 0 } ],

        [0,     4000,   4000,    'aaa',      { x: xo + w * 0, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 1, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 2, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 3, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 4, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 5, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 6, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 7, y: yo - h * 1 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 8, y: yo - h * 1 } ],

        [0,     4000,   4000,    'aaa',      { x: xo + w * 0, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 1, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 2, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 3, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 4, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 5, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 6, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 7, y: yo - h * 2 } ],
        [0,     4000,   4000,    'aaa',      { x: xo + w * 8, y: yo - h * 2 } ],

        [0,     4000,   4000,    'bbb',      { x: xo + w * 1, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 2, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 3, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 4, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 5, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 6, y: yo - h * 3 } ],
        [0,     4000,   4000,    'bbb',      { x: xo + w * 7, y: yo - h * 3 } ],

        [0,     4000,   4000,    'ccc',      { x: xo + w * 2, y: yo - h * 4 } ],
        [0,     4000,   4000,    'ccc',      { x: xo + w * 3, y: yo - h * 4 } ],
        [0,     4000,   4000,    'ccc',      { x: xo + w * 4, y: yo - h * 4 } ],
        [0,     4000,   4000,    'ccc',      { x: xo + w * 5, y: yo - h * 4 } ],
        [0,     4000,   4000,    'ccc',      { x: xo + w * 6, y: yo - h * 4 } ],

        [0,     4000,   4000,    'ddd',      { x: xo + w * 3, y: yo - h * 5 } ],
        [0,     4000,   4000,    'ddd',      { x: xo + w * 4, y: yo - h * 5 } ],
        [0,     4000,   4000,    'ddd',      { x: xo + w * 5, y: yo - h * 5 } ],

        //[0,     4000,   500,    'step' ],
        //[6000,  13000,  800,    'ltr' ],
        //[12000, 16000,  400,    'circle' ],
        //[18200, 20000,  500,    'straight', { x: 150 } ],
        //[18200, 20000,  500,    'straight', { x: 100 } ],
        //[18400, 20000,  500,    'straight', { x: 200 } ],
        //[22000, 25000,  400,    'wiggle',   { x: 300 } ],
        //[22000, 25000,  400,    'wiggle',   { x: 220 } ],
    ];

    // Show star fields and title screen

    var startGame = function() {
        Game.setBoard(0, new StarField(20, 0.4, 80, true));
        Game.setBoard(1, new StarField(50, 0.6, 40));
        Game.setBoard(2, new StarField(100, 1.0, 10));
        Game.setBoard(3, new TitleScreen('Axian', 'Press fire to start', playGame));
    };

    // Set up the game board and play

    var playGame = function() {
        Game.points = 0;
        Game.lives = 3;
        var board = new GameBoard();
        board.add(new PlayerShip());
        board.add(new Level(level1, enemies, winGame, loseGame));
        Game.setBoard(3, board);
        Game.setBoard(4, new Lives(2));
        Game.setBoard(5, new GamePoints());
    };

    // React to a win

    var winGame = function() {
        Game.removeBoard(4);
        Game.removeBoard(3);
        Game.setBoard(3, new TitleScreen('Axian', 'Press fire to play again', playGame));
    }

    // React to a loss

    var loseGame = function() {
        Game.removeBoard(4);
        Game.removeBoard(3);
        Game.setBoard(3, new TitleScreen('Axian', 'Press fire to play again', playGame));
    }

    window.addEventListener('load', function() {
        Game.init('game', sprites, types, startGame);
        window.addEventListener('deviceready', function() {
            console.log('device ready');
            // TODO: set up touch controls
        }, false);
    });

}());
