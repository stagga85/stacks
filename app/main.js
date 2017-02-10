define(function (require) {
	'use strict';
	var messages = require('./messages');
	var util = require('./util');
	var $ = require('jquery');
	var print = require('print');
	var _ = require('underscore');
	var Box2D = require('box2d');

	var render = require('./render');

	var canvas = document.getElementById('canvas');
	var ctx = canvas.getContext('2d');

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

	var world = new b2World(new b2Vec2(0, 9.00), true);
	setUpDebugDraw();
	window.setInterval(update, 1000 / 60);

	const SCALE = 30;

	new Rect(0, 0, 10, 10, b2Body.b2_dynamicBody, '', new b2Vec2(0.0, 0.0));
	
	function update () {
		world.Step(1/60,10,10);
		world.DrawDebugData();
        world.ClearForces();
	}

	function Rect(x, y, width, height, type, name, vel) {
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
	};

	function setUpDebugDraw () {
	    var debugDraw = new b2DebugDraw();
	    debugDraw.SetSprite(ctx);
	    debugDraw.SetDrawScale(30.0);
	    debugDraw.SetFillAlpha(0.5);
	    debugDraw.SetLineThickness(1.0);
	    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	    world.SetDebugDraw(debugDraw);
	}


	




});