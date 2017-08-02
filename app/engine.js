define(function (require) {
	var Box2D = require('box2d');
	var render = require('./render');
	var utils = require('./engineUtils');
	var $ = require('jquery');

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

	var _world;
	var _SCALE = 30;
	var _GRID_SIZE = 40;
	var _gameObjects = [];
	var _imageResources = [];
	
	var _canvas;
	var _ctx;

	var _cursorX;
	var _cursorY;

	var _drawGrid = false;
	var _debugging = false;

	function _log (message) {
		if (_debugging) {
			console.log(message);
		}
	}

	function _update () {
		_ctx.clearRect(0, 0, _canvas.width, _canvas.height);
		_world.Step(1/60, 10, 10);

		_renderGameObjects();

		if (_drawGrid) {
			utils.drawGrid(0.8, _GRID_SIZE, _canvas.width, _canvas.height, _ctx);
		}

		_world.ClearForces();
	}

	function _renderGameObjects () {
	    for (element in _gameObjects) {
	    	_gameObjects[element].draw();
	    	if (new Date().getTime() - _gameObjects[element].timeMade > 5000 && _gameObjects[element].particle) {
	    		_removeBody(_gameObjects[element].body);
	    		delete _gameObjects[element];
	    	}
	    }
	}

	function _removeBody (bodyToDelete) {
		var body = _world.GetBodyList();
        while (body) {
            var currentBody = body;
            if (currentBody === bodyToDelete) {
                _world.DestroyBody(currentBody);
                console.log("body removed");
            }
            body = body.GetNext();
        }
	}
    
    function _updateCursorLocation (mouseMove) {
    	var canvasRect = _canvas.getBoundingClientRect();

		_cursorX = mouseMove.clientX - canvasRect.left;
    	_cursorY = mouseMove.clientY - canvasRect.top;
	}

	function _init (params) {
		_world = new b2World(new b2Vec2(0, 9.00), true);

		_canvas = document.getElementById(params.canvas);
		_canvas.addEventListener("mousemove", _updateCursorLocation, false);

		// Prevent default right-click browser action.
		_canvas.addEventListener('contextmenu', function(e) {
    		e.preventDefault();
   			e.stopPropagation();
		}, false);  

		_canvas.width = params.width;
		_canvas.height = params.height;

		_ctx = _canvas.getContext('2d');

		_makeBoundaries();

		window.setInterval(_update, 1000 / 60);

		//window.setInterval(_spewBox, 1000 / 60);
	}

	function _spewBox () {
		_gameObjects[id++] = new Rect(50, 50, 20, 20, b2Body.b2_dynamicBody, id, new b2Vec2(5.0, 0), _world, true);
	}

	var id = 0;
	function placeBlock (image) {
		_log(_gameObjects.length);
	    _gameObjects[id++] = new Rect(_cursorX, _cursorY, 10, 10, b2Body.b2_dynamicBody, id, new b2Vec2(0.0, 0.0), _world, false, image);
	}

	function placeStaticBlock (image, size) {
		_log(_gameObjects.length);
	    _gameObjects[id++] = new Rect(
	    								_snapToX(_cursorX, size), 
	    								_snapToY(_cursorY, size), 
	    								size, 
	    								size, 
	    								b2Body.b2_staticBody, 
	    								id, 
	    								new b2Vec2(0.0, 0.0), 
	    								_world, 
	    								false, 
	    								image
    								);
	}

	function _makeBody (width, height, pX, pY, type, name, vel) {
	    var bodyDef = new b2BodyDef;
	    bodyDef.type = type;
	    bodyDef.userData = name;
	    bodyDef.position.Set(pX/_SCALE,pY/_SCALE);

	    var polygonShape = new b2PolygonShape;
	    polygonShape.SetAsBox(width/2/_SCALE,height/2/_SCALE);

	    var fixtureDef = new b2FixtureDef;
	    fixtureDef.density = 4.0;
	    fixtureDef.friction = 0.2;
	    fixtureDef.restitution = 0.1;
	    fixtureDef.shape = polygonShape;

	    // Adding the body to the Box2D world.
	    var body = _world.CreateBody(bodyDef);
	    body.SetLinearVelocity(vel);
	    body.CreateFixture(fixtureDef);

	}

	function _makeBoundaries() {
	    // Floor
	    _makeBody(_canvas.width,30,_canvas.width/2,_canvas.height+15,b2Body.b2_staticBody, "wall");

	    // Ceiling
	    //_makeBody(_canvas.width,30,_canvas.width/2,0,b2Body.b2_staticBody, "wall");

	    // Left
	    _makeBody(30,_canvas.height,-15,_canvas.height/2,b2Body.b2_staticBody, "wall");

	    // Right
	    _makeBody(30,_canvas.height,_canvas.width + 15,_canvas.height/2,b2Body.b2_staticBody, "wall");
	}

	function Rect (x, y, width, height, type, name, vel, world, particle, image) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.timeMade = new Date().getTime();
		this.particle = particle;

		this.image = image;

		this.bodyDef = new b2BodyDef;
		this.bodyDef.type = type;
		this.name = name;
		this.bodyDef.userData = name;
		this.bodyDef.position.Set(x / _SCALE, y / _SCALE);

		this.polygonShape = new b2PolygonShape;
		this.polygonShape.SetAsBox(width / 2 / _SCALE, height / 2 / _SCALE);

		this.fixtureDef = new b2FixtureDef;
		this.fixtureDef.density = 4.0;
		this.fixtureDef.friction = 0.2;
		this.fixtureDef.restitution = 0.1;
		this.fixtureDef.shape = this.polygonShape;
	 
		this.body = world.CreateBody(this.bodyDef);
		this.body.SetLinearVelocity(vel);
		this.body.CreateFixture(this.fixtureDef);
	}

	Rect.prototype.draw = function() {
		var position = this.body.GetPosition();
	 	var angle = this.body.GetAngle();

	 	_ctx.save();
	 	_ctx.translate(position.x * _SCALE, position.y * _SCALE);

	    if (_debugging) {
	        _ctx.font = "10px Arial";
	        _ctx.fillStyle = "grey";
	        _ctx.fillText(this.name, position.x - this.width * 2, position.y - this.height * 2);
	    } 

	 	_ctx.rotate(angle);

	 	if (this.image == null) {
	 		_ctx.globalAlpha = 0.5;
	 		_ctx.beginPath();
	 		_ctx.rect(this.width / 2, this.height / 2, -this.width, -this.height);
	        
			_ctx.fillStyle = "red";
			_ctx.fill();
			_ctx.closePath();
			_ctx.globalAlpha = 1.0;
	 	} else {
	 		_ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
	 	}
	    
		_ctx.restore();
	};

	function _snapToX(xCoord, size) {
	    for (var i = 0; i < _canvas.width; i += size) {
	        if (xCoord >= i && xCoord <= i + size) {
	            return i + _GRID_SIZE / 2;
	        }
	    }
	}

	function _snapToY(yCoord, size) {
	    for (var i = 0; i < _canvas.width; i += size) {
	        if (yCoord >= i && yCoord <= i + size) {
	            return i + _GRID_SIZE / 2;
	        }
	    }
	}

	var createWorld = function (params) {
		_init(params);
	};

	var toggleGrid = function () {
		_drawGrid = !_drawGrid;
	};

	var toggleDebug = function () {
		_debugging = !_debugging;
	};

	var loadImageResource = function (params) {
		console.log(params);
		_imageResources[params.name] = new Image();
		_imageResources[params.name].src = params.url;

		return _imageResources[params.name];
	};

	return {
		createWorld: createWorld,
		toggleGrid: toggleGrid,
		toggleDebug: toggleDebug,
		placeBlock: placeBlock,
		placeStaticBlock: placeStaticBlock,
		loadImageResource: loadImageResource
	}
});