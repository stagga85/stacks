define(function (require) {
	'use strict';
	var messages = require('./messages');
	var util = require('./util');
	var $ = require('jquery');
	var print = require('print');
	var _ = require('underscore');
	var Box2D = require('box2d');

	var render = require('./render');

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

	//window.setInterval(update, 1000 / 60);

	function update () {
		world.Step(1/60,10,10);
	}

	var Game = Engine.createWorld({

	});

	Game.addBox({
		width: 10,
		height: 10,
		weight: 
	});

});