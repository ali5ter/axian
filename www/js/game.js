/*

   @file game.js
   Axian game
   Based on code from Pascal Retting's excellent book, 'Professional HTML5
   Mobile Game Development'

*/

// Sprite object identifiers

var OBJECT_PLAYER = 1,
    OBJECT_PLAYER_PROJECTILE = 2,
    OBJECT_ENEMY =4,
    OBJECT_ENEMY_PROJECTILE = 8,
    OBJECT_POWERUP = 16;

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
        flag: { sx:272, sy:80, w:14, h:22, frames:1 }
    };

// Enemy behaviours

var enemies = {
    basic:  { x:0, y:-50, sprite:'alien1', damage:1, health:10, hold:20,
              E:100 },
    ltr:    { x:0, y:-100, sprite:'alien1', damage:1, health:10, hold:20,
              B:200, C:1, E:200 },
    circle: { x:400, y:-50, sprite:'alien4', damage:1, health:10, hold:20,
              A:0, B:-200, C:1, E:20, F:200, G:1, H:Math.PI/2 },
    wiggle: { x:100, y:-50, sprite:'alien3', damage:1, health:20, hold:20,
              B:100, C:4, E:100 },
    step:   { x:0, y:-50, sprite:'alien2', damage:1, health:10, hold:20,
              B:100, C:1.5, E:60 },
};

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

    // @method init
    // Set up canvas, key bindings, load sprite sheet and start animation loop
    // @param canvasId canvas id attribute string value
    // @param spriteData Array of mapping objects
    // @param callback once sprite sheet image has loaded
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
    // Add a board to the game board object
    // @param zIndex index of where the board sits in the stack
    // @param board the board object that should contain at least a draw and
    //        step method
    this.setBoard = function(zIndex, board) { boards[zIndex] = board; };
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
    this.x = 0;
    this.y = Game.height - this.h;
    this.remaining = 2;

    this.draw = function(ctx) {
        for (var i = 0; i < this.remaining; i++) {
            SpriteSheet.draw(ctx, 'life', (this.w+8)*i, this.y, 0);
        }
    };

    this.step = function(dt) {
        //TODO: reduce remiaining when ship dies
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
};

PlayerShip.prototype = new Sprite();

PlayerShip.prototype.type = OBJECT_PLAYER;

/* ---------------------------------------------------------------------------
 *
 * @class PlayerMissile
 * The players ship missile sprite
 *
 */

var PlayerMissile = function(x, y) {
    this.setup('shipMissile', { vy:-700, damage:10 });
    this.x = x - this.w/2;
    this.y = y - this.h;
};

PlayerMissile.prototype = new Sprite();

PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt) {
    this.y += this.vy * dt;
    // return the first enemy sprit object this missile hits
    var collision = this.board.collide(this, OBJECT_ENEMY);
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
    this.merge(override);
};

Enemy.prototype = new Sprite();

Enemy.prototype.type = OBJECT_ENEMY;

Enemy.prototype.baseParms = { A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, t:0 };

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
    var collision = this.board.collide(this, OBJECT_PLAYER);
    if (collision) {
        collision.hit(this.damage);
        this.board.remove(this);
    };
    if (this.y > Game.height) this.y = 0;
    else if (this.x < -this.w) this.x = Game.width;
    else if (this.x > Game.width) this.x = -this.w;
    this.frame = Math.floor(this.subFrame++ / this.hold);
    if (this.subFrame >= this.frames * this.hold) this.subFrame = 0;
};

/* ---------------------------------------------------------------------------
 *
 * @class Explosion
 * An explosion sprite
 * @param type object type of the sprite to explode
 * @param cX center x coordinate
 * @param cY center y coordinate
 *
 */

var Explosion = function(type, cX, cY) {
    if (type === OBJECT_PLAYER)  this.setup('shipExplosion', { hold:5 });
    else this.setup('alienExplosion', { hold:3 });
    this.type = type;
    this.x = cX - this.w/2;
    this.y = cY - this.h/2;
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
    this.frame = Math.floor(this.subFrame++ / this.hold);
    if (this.subFrame >= this.frames * this.hold) {
        this.board.remove(this);
    }
};


/ *------------------------------------------------------------------------- */

// Show star fields and title screen

var startGame = function() {
    Game.setBoard(0, new StarField(20, 0.4, 80, true));
    Game.setBoard(1, new StarField(50, 0.6, 40));
    Game.setBoard(2, new StarField(100, 1.0, 10));
    Game.setBoard(3, new TitleScreen('Axian', 'Press fire to start', playGame));
};

// Set up the game board and play

var playGame = function() {
    var board = new GameBoard();
    board.add(new Enemy(enemies.basic));
    board.add(new Enemy(enemies.ltr, { x:50 }));
    board.add(new Enemy(enemies.circle, { x:100 }));
    board.add(new Enemy(enemies.wiggle, { x:150 }));
    board.add(new Enemy(enemies.step, { x:200 }));
    board.add(new PlayerShip());
    Game.setBoard(3, board);

    Game.setBoard(4, new Lives(2));
};

// Start the game once the page is loaded

window.addEventListener('load', function() {
    Game.init('game', sprites, startGame);
});
