/** 
In the process of adding all of the sources for some of the code.

**/

var LEFT = 0;
var SCROLL = 1; 
var RIGHT = 2;

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var width = canvas.width;
var height = canvas.height;

var gridSize = 40;

// Snap to grid off by default.
var gridEnabled = false;

// Set initial cursor off screen.
var cursorX = -100;
var cursorY = -100;

// Box2D Variables.
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2AABB = Box2D.Collision.b2AABB;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
var b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

var SCALE = 30;

var boxSize = 40;
var beamW = boxSize * 7;
var beamH = boxSize;

// Resources.
var makeObjectSound = document.getElementById("audio");
var explodeSound = document.getElementById("explosion");
var crateImage = document.getElementById("source");
var ground = document.getElementById("ground");

// Array used to hold all of the active entities. 
var gameObjects = {};

var explosions = [];


// NOT MY CODE!

/*
 * Converts from degrees to radians.
 */
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

/*
 * Converts from radians to degrees.
 */
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

/*
 * Normalize2
 * Returns the normal of the vector b.
 */
function Normalize2(b) {
    return Math.sqrt(b.x * b.x + b.y * b.y);
}

/*
 * p2b
 * Helper function to convert pixels to 
 * Box2D metrics.
 */
function p2b(pixels) {
    return pixels / SCALE;
}


/*
 * Particle Explosion Class
 * A more realistic explosion, but has a big performance hit. 
 * Especially when the particles hit multiple dynamic objects
 * within a very short period of time. 
 */
ParticleExplosionClass = Class.extend({
    
    particles: [], // List of particles in the explosion
    
    _killed: false, // flag indicating if the explosion is completed

    // Initialise the explosion.
    // Input parameter:
    // - x and y coordinates
    init: function( x_pos, y_pos ) {
        // Number of particles in the explosion
        var numParticles = 30;
        
        // Blast power applied to each particle
        var blast_power = 1000;
        
        // Density proportional to the number of particles
        var density = 300.0 / numParticles;
        
        // Introduce some randomness to the explosion
        var random_start_angle = Math.random() * 90;
    
        for ( var i = 0; i < numParticles; i++){
            var angle = Math.radians(((i / numParticles) * 360) + random_start_angle);
            var particle = new ParticleClass({x: x_pos,
                                              y: y_pos},
                                              angle, 
                                              density, 
                                              blast_power, 
                                              this);
            this.particles.push(particle);
        }
    },
    
    // Remove a particle from the list of particles in the explosion.
    // The function is called by the particle's kill function.
    removeParticle: function(particle) {
        world.DestroyBody(particle.body)
        this.particles.erase(particle);
    },
    
    // Update all particles
    update: function() {
        if ( this.particles.length <= 0) {
            this.kill();
            return; 
        }
        
        for ( var i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
        }
    },
    
    // Destroy this explosion instance
    kill: function() {
        this._killed = true;
    }
});

/*
 * Particle Class
 * Represents a particle in an explosion. It includes functions to update
 * the state of the particle during the explosion.
 */
ParticleClass = Class.extend({
    body: null, // Reference to Box2D physics body

    pos: {x: 0, y: 0},  // The coordinates of the particle.
    
    lifespan: 250, // Countdown timer
    
    parent: null, // The parent object controlling the explosion
    
    init: function(position, angle, density, blast_power, parent) {
        var dir_vector = new b2Vec2(Math.sin(angle), Math.cos(angle));
        
        var fixDef = new b2FixtureDef;
        
        this.pos = position;
        
        this.parent = parent;
        
        // very high - shared across all particles
        fixDef.density = density;   
        // friction not necessary
        fixDef.friction = 0.0;  
        // high restitution to reflect off obstacles
        fixDef.restitution = 0.99   
        // particles should not collide with each other
        fixDef.filter.groupIndex = -1;  
        
        fixDef.shape = new b2CircleShape(0.05); // very small radius
 
        var bodyDef = new b2BodyDef;
        bodyDef.type = b2Body.b2_dynamicBody;
        
        // Position in the Box2D world
        bodyDef.position.x = p2b(position.x);
        bodyDef.position.y = p2b(position.y);
        
        // The body doesn't need to rotate
        bodyDef.fixedRotation = true;
        
        // Prevent tunnelling at high speed
        bodyDef.bullet = true;
        
        // Drag due to moving through air
        bodyDef.linearDamping = 2.5; 
        
        bodyDef.linearVelocity = new b2Vec2(blast_power * dir_vector.x,
                                          blast_power * dir_vector.y);
 
        var b = world.CreateBody(bodyDef);
        
        b.CreateFixture(fixDef);
        
        return this.body = b;
    },
    
    // Update the size and position of the particle
    update: function() {
        this.lifespan -= 15;
        
        if ( this.lifespan <= 0 ) {
            this.kill();
            return;
        }

        
        var pos = this.body.GetPosition();
        this.pos.x = pos.x * SCALE;
        this.pos.y = pos.y * SCALE;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.fillStyle = "#5668A5";
        ctx.arc(this.pos.x,this.pos.y,2.5,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
    },
    
    // Destroy the particle
    kill: function(){
        this.parent.removeParticle(this);
    }
});


/*
 * removeExplosion
 * Remove an explosion object from the explosions list.
 */
function removeExplosion(explosion) {
    return explosions.erase(explosion);
}

// NOT MY CODE!

var debug = false;

// Prevent right click on the game aera.
canvas.oncontextmenu = function (e) {
   	e.preventDefault();
};

function rand(min, max) {
   	return Math.random() * (max - min) + min;
}

function Rect(x, y, width, height, type, name, vel, world, image) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;

	this.bodyDef = new b2BodyDef;
	this.bodyDef.type = type;
	this.name = name;
	this.bodyDef.userData = name;
	this.bodyDef.position.Set(x / SCALE, y / SCALE);

	this.polygonShape = new b2PolygonShape;
	this.polygonShape.SetAsBox(width / 2 / SCALE, height / 2 / SCALE);

	this.fixtureDef = new b2FixtureDef;
	this.fixtureDef.density = 4.0;
	this.fixtureDef.friction = 0.2;
	this.fixtureDef.restitution = 0.1;
	this.fixtureDef.shape = this.polygonShape;
 
	this.body = world.CreateBody(this.bodyDef);
	this.body.SetLinearVelocity(vel);
	this.body.CreateFixture(this.fixtureDef);

	this.imageName = image;

	this.image = document.getElementById(image);
};

Rect.prototype.draw = function() {
	var position = this.body.GetPosition();
 	var angle = this.body.GetAngle();

 	ctx.save();
 	ctx.translate(position.x * SCALE, position.y * SCALE);

    if (debug) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "grey";
        ctx.fillText(this.name, -10, -30);
    } 

 	ctx.rotate(angle);

 	if (this.image == null) {
 		ctx.globalAlpha = 0.5;
 		ctx.beginPath();
 		ctx.rect(this.width / 2, this.height / 2, -this.width, -this.height);
        
		ctx.fillStyle = "#586899";
		ctx.fill();
		ctx.closePath();
		ctx.globalAlpha = 1.0;
 	} else {
      
 		ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
 	}
    
	ctx.restore();
};

function save() {
    var gameSave = [];

    for (element in gameObjects) {
        var position = gameObjects[element].body.GetPosition();
        var box = {
            "x" : position.x * SCALE,
            "y" : position.y * SCALE,
            "angle" : gameObjects[element].body.GetAngle(),
            "width" : gameObjects[element].width,
            "height" : gameObjects[element].height,
            "name" : gameObjects[element].name,
            "image" : gameObjects[element].imageName
        }
        gameSave.push(box);
    };

    console.log(JSON.stringify(gameSave));
}

function load() {
    removeAllObjects();

    $.getJSON("JSON/save.JSON", function(result){
        $.each(result, function(i, field){
            console.log(field);
            gameObjects[field.name + "_" + id] =
             	new Rect(
                    field.x,
                    field.y,
                    field.width,
                    field.height,
                    b2Body.b2_dynamicBody,
                    field.name + "_" + id++,
                    new b2Vec2(0.0, 0.0),
                    world,
                    field.image
                );
        });
    });
}

var currentPiece = 1;
var pieceCount = 3;


function changePiece(e) {
    var key = e.keyCode ? e.keyCode : e.which;

    if (key == 39 && currentPiece != pieceCount) {
        currentPiece++;
    } else if (key == 37 && currentPiece != 0) {
        currentPiece--;
    }
    console.log("currentPiece = " + currentPiece);

    if (currentPiece === 0) {
        document.getElementById("canvas").style.cursor = "auto";
    } else {
        document.getElementById("canvas").style.cursor = "none";
    }
}

// For Chrome
window.addEventListener('mousewheel', changePiece);

// For Firefox
window.addEventListener('DOMMouseScroll', changePiece);

var keys = [];

document.body.addEventListener("keydown", function(e) {
    keys[e.keyCode] = true;
});
 
document.body.addEventListener("keyup", function(e) {
    keys[e.keyCode] = false;
});

// Key listener
window.onkeydown = function (e) {
    changePiece(e);

    var code = e.keyCode ? e.keyCode : e.which;

    console.log(code);
    switch (code) {
        case 70: // F
            fireBox(new b2Vec2(70.0, 4.0));
            break;
        case 49:
            if (boxSize > 40) boxSize -= 40;
            break;
        case 38:
        	break;
        case 40:
        	break;
        case 50:
            if (boxSize < 80) boxSize += 40;
            break;
        case 66:
            placePlatform();
            break;
        case 68:
            debug = !debug;
            break;
        case 90:
            removeLastObject();
            break;
        case 71:
            toggleGrid();
            break;
        case 83:
            save();
            break;
        case 76:
            load();
            break;
        default:

    }
}

function placePlatform() {
    var x = snapToX(cursorX);
    var y = snapToY(cursorY);
    
    var currentBoxId = "solid_" + id++;
    gameObjects[currentBoxId] = new Rect(x, y, boxSize, boxSize, b2Body.b2_staticBody, currentBoxId, new b2Vec2(0.0, 0.0), world, "creet")
    
}

function toggleGrid() {
    if (gridEnabled) {
        gridEnabled = false;
        console.log('Snap-to-grid Disabled');
    } else {
        gridEnabled = true;
        console.log('Snap-to-grid Enabled');
    }
}

function removeLastObject() {
    var body = world.GetBodyList();
    if (gameObjects.length > 0) {
        var bodyToDelete = gameObjects.pop();
        while(body) {
            var currentBody = body;
            if (currentBody === bodyToDelete.body) {
                world.DestroyBody(currentBody);
                console.log("body removed");
            }
            body = body.GetNext();
        }
    }
}

function removeAllObjects() {
	gameObjects = {};
    var body = world.GetBodyList();
    while(body) {
        var currentBody = body;
        if (currentBody.GetUserData() !== 'wall') {
            world.DestroyBody(currentBody);
            console.log("body removed");
        }
        body = body.GetNext();
    }
}

function makeBoundaries() {
    // Floor
    createBox(width,30,width/2,height+15,b2Body.b2_staticBody, "wall");

    // Ceiling
    //createBox(width,30,width/2,0,b2Body.b2_staticBody, "wall");

    // Left
    createBox(30,height,-15,height/2,b2Body.b2_staticBody, "wall");

    // Right
    createBox(30,height,width + 15,height/2,b2Body.b2_staticBody, "wall");
}

var id = 0;
function fireBox(vel) {
	var currentBoxId = "box_" + id++;
	gameObjects[currentBoxId] = new Rect(cursorX, cursorY, 40, 40, b2Body.b2_dynamicBody, currentBoxId, vel, world, "source");
}

// Update cursor location.

var mouseX;
var mouseY;
var mouse_joint = false;

function updateCursorLocation(mouseMove) {
    cursorX = mouseMove.clientX;
    cursorY = mouseMove.clientY;

    var top  = window.pageYOffset || document.documentElement.scrollTop,
    left = window.pageXOffset || document.documentElement.scrollLeft;

    mouseX = (cursorX - canvas.offsetLeft) / SCALE;
    mouseY = (cursorY - canvas.offsetTop + top) / SCALE;


     if(mouse_pressed && !mouse_joint && currentPiece == 0)
        {
            var body = GetBodyAtMouse();
             
            if(body)
            {
                //if joint exists then create
                var def = new b2MouseJointDef();

                var bodyDef = new b2BodyDef;
                bodyDef.position.Set(0/SCALE,0/SCALE);

                var polygonShape = new b2PolygonShape;
                polygonShape.SetAsBox(10/2/SCALE,10/2/SCALE);

                var fixtureDef = new b2FixtureDef;
                fixtureDef.density = 4.0;
                fixtureDef.friction = 0.2;
                fixtureDef.restitution = 0.1;
                fixtureDef.shape = polygonShape;

                // Adding the body to the Box2D world.
                ground = world.CreateBody(bodyDef);
                body.CreateFixture(fixtureDef);
                 
                def.bodyA = ground;
                def.bodyB = body;
                def.target = new b2Vec2(mouseX, mouseY);
                 
                def.collideConnected = true;
                def.maxForce = 1000 * body.GetMass();
                def.dampingRatio = 0;
                 
                mouse_joint = world.CreateJoint(def);
                 
                body.SetAwake(true);
            }
        }
        else
        {
            //nothing
        }
         
        if(mouse_joint)
        {
            mouse_joint.SetTarget(new b2Vec2(mouseX, mouseY));
        }

    cursorX -= canvas.offsetLeft;
    cursorY -= canvas.offsetTop;
}

function startBoxes() {
    for (var i = 10; i < width; i += gridSize * 2) {
        createBox(gridSize, gridSize, i, 0, b2Body.b2_dynamicBody, "box_" + id++);
    }
}

function drawGrid(alpha) {
    ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
    ctx.beginPath();

    for (var x = boxSize; x < width; x += boxSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    for (var y = height; y > 0; y -= boxSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.stroke();

    ctx.strokeStyle = 'rgb(43, 61, 117,' + 1.0 + ')';
    ctx.beginPath();

    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);

    ctx.moveTo(width, 0);
    ctx.lineTo(width, height);

    ctx.stroke();
}

function snapToX(xCoord) {
    for (var i = 0; i < width; i += boxSize) {
        if (xCoord >= i && xCoord <= i + boxSize) {
            return i + boxSize / 2;
        }
    }
}

function snapToY(yCoord) {
    for (var i = 0; i < width; i += boxSize) {
        if (yCoord >= i && yCoord <= i + boxSize) {
            return i + boxSize / 2;
        }
    }
}


function boxController(click) {
    var explosion = null;

    var x = click.pageX;
    var y = click.pageY;

    x -= canvas.offsetLeft;
    y -= canvas.offsetTop;

    //console.log(x);

    // Snap to grid x-coordinate.
    if (gridEnabled) {
        x = snapToX(x);
    };

    if (click.button === LEFT && currentPiece == 1) {
      	var currentBoxId = "box_" + id++;
        gameObjects[currentBoxId] = new Rect(x, y, boxSize, boxSize, b2Body.b2_dynamicBody, currentBoxId, new b2Vec2(0.0, 0.0), world, "source");
        playSound(makeObjectSound);
    } else if (click.button === LEFT && currentPiece == 2) {
    	var currentBoxId = "box_" + id++;
        gameObjects[currentBoxId] = new Rect(x, y, beamW, beamH, b2Body.b2_dynamicBody, currentBoxId, new b2Vec2(0.0, 0.0), world);
        playSound(makeObjectSound);
    } else if (click.button === LEFT && currentPiece == 3) {
        var x = snapToX(cursorX);
        var y = snapToY(cursorY);
        var currentBoxId = "ground_" + id++;
        gameObjects[currentBoxId] = new Rect(x, y, boxSize, boxSize, b2Body.b2_staticBody, currentBoxId, new b2Vec2(0.0, 0.0), world, "ground");
        playSound(makeObjectSound);
    } else if (click.button == LEFT && currentPiece == 0) {
        console.log(GetBodyAtMouse());    
    } else if (click.button == RIGHT && loadReady && (currentPiece == 0 || currentPiece == 1)) {
        explosion = new ParticleExplosionClass(x, y);
        playSound(explodeSound);
        loadReady = false;
    }

    if ( explosion !== null) explosions.push(explosion);
}

var loadReady = true;
var loadPercent = 0; // Seconds
function drawLoad() {
    var radius = 40;
    var endPercent = 110;
    var counterClockwise = false;
    var circ = Math.PI * 2;
    var quart = Math.PI / 2;

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#307481';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = '#0F4B56';

    ctx.beginPath();
    ctx.arc(cursorX, cursorY, radius, -(quart), ((circ) * (loadPercent / 100)) - quart, false);
    ctx.stroke();
    loadPercent++;

    if (loadPercent >= endPercent) {
        loadReady = true;
        loadPercent = 0;
    }

    ctx.lineWidth = 1;
    
}

function GetBodyAtMouse(includeStatic) {
    var mouse_p = new b2Vec2(mouseX, mouseY);
    var sensitivity_offset = 0.001;
 
    var aabb = new b2AABB();
    aabb.lowerBound.Set(mouseX - sensitivity_offset, 
                        mouseY - sensitivity_offset);
 
    aabb.upperBound.Set(mouseX + sensitivity_offset, 
                        mouseY + sensitivity_offset);
 
    var body = null;
 
    // Query the world for overlapping shapes.
    function GetBodyCallback(fixture) {
        var shape = fixture.GetShape();
 
        if (fixture.GetBody().GetType() != b2Body.b2_staticBody || includeStatic)
        {
            var inside = shape.TestPoint(fixture.GetBody().GetTransform(), mouse_p);
 
            if (inside)
            {
                body = fixture.GetBody();
                return false;
            }
        }
 
        return true;
    }
 
    world.QueryAABB(GetBodyCallback, aabb);
    return body;
}

function playSound(sound) {
    sound.currentTime = 0;
    sound.volume = (Math.random() * (0.35 - 0.25) + 0.25).toFixed(4)
    sound.play();
}

function createBox(width, height, pX, pY, type, name, vel) {
    var bodyDef = new b2BodyDef;
    bodyDef.type = type;
    bodyDef.userData = name;
    bodyDef.position.Set(pX/SCALE,pY/SCALE);

    var polygonShape = new b2PolygonShape;
    polygonShape.SetAsBox(width/2/SCALE,height/2/SCALE);

    var fixtureDef = new b2FixtureDef;
    fixtureDef.density = 4.0;
    fixtureDef.friction = 0.2;
    fixtureDef.restitution = 0.1;
    fixtureDef.shape = polygonShape;

    // Adding the body to the Box2D world.
    var body = world.CreateBody(bodyDef);
    body.SetLinearVelocity(vel);
    body.CreateFixture(fixtureDef);
}

function explode() {

}

function renderGameObjects() {
    //var body = world.GetBodyList();


    for (element in gameObjects) {
    	gameObjects[element].draw();
    }

    drawCursorObject(currentPiece);
    
}

function drawCursorObject(currentPiece) {
    if (currentPiece == 1) {
        // Draw cursor box.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(crateImage, cursorX - boxSize / 2, cursorY - boxSize / 2, boxSize, boxSize);
        ctx.globalAlpha = 1;
    } else if (currentPiece == 2) {
        // Draw cursor rect.
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.rect(cursorX - beamW / 2, cursorY - beamH / 2, beamW, beamH);
        
        ctx.fillStyle = "#586899";
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;
    } else if (currentPiece == 3) {
        // Draw cursor box.
        ctx.globalAlpha = 0.5;
        ctx.drawImage(ground, cursorX - boxSize / 2, cursorY - boxSize / 2, boxSize, boxSize);
        ctx.globalAlpha = 1;
    }




       

}

function debugDraw() {
    var debugDraw = new b2DebugDraw();
    debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
    debugDraw.SetDrawScale(30.0);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);
}




// Main game render loop.
function update() {
    var deferred_kills = [];

    ctx.clearRect(0, 0, width, height);

    if (debug) {
        ctx.font = "10px Arial";
        ctx.fillStyle = "grey";
        ctx.fillText("Object count: " + Object.keys(gameObjects).length, 10, 50);
    } 

    // Step the physics simulation.
    world.Step(1/60,10,10);

    // First update the explosions
    for ( var i = 0; i < explosions.length; i++ ) {
        explosions[i].update();
        if(explosions[i]._killed)
            deferred_kills.push(explosions[i]);
    }
    
    // Remove any explosions that are completed
    for ( var i = 0; i < deferred_kills.length; i++ ) {
        removeExplosion(deferred_kills[i]);
    }

    world.ClearForces();

    
    if (debug) { 
        world.DrawDebugData();
    }    

    renderGameObjects();

    if (!loadReady) {
        drawLoad();
    }

    drawGrid(0.1);
    checkActiveConfig();
}

var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact) {
    	//console.log(contact.GetFixtureA().GetBody().GetUserData());
    }
    listener.EndContact = function(contact) {
       // console.log(contact.GetFixtureA().GetBody().GetUserData());
    }
    listener.PostSolve = function(contact, impulse) {
        
    }
    listener.PreSolve = function(contact, oldManifold) {

    }
    

var world = null;

function init() {
    // Event listeners for canvas.
    canvas.addEventListener("mousedown", boxController, false);
    canvas.addEventListener("mousemove", updateCursorLocation, false);

    // World object that tracks all the moving bodies.
    world = new b2World(new b2Vec2(0, 9.00), true);
    world.SetContactListener(listener);
    debugDraw();


    makeBoundaries();

    window.setInterval(update, 1000 / 60);

    // gameObjects[].push(
    //     new Rect(100, 100, boxSize, boxSize, b2Body.b2_dynamicBody, "box_" + id++, new b2Vec2(0.0, 0.0), world, "source")
    // );
}

var mouse_pressed;

$(canvas).mousedown(function() {
    //flag to indicate if mouse is pressed or not
    mouse_pressed = true;
});
     
    /*
        When mouse button is release, mark pressed as false and delete the mouse joint if it exists
    */
$(canvas).mouseup(function() {
    mouse_pressed = false;
     
    if(mouse_joint)
    {
        world.DestroyJoint(mouse_joint);
        mouse_joint = false;
    }
});

$(document).ready(function() {
    init();
});