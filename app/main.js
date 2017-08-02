define(function (require) {
	'use strict';
	var $ = require('jquery');
	var log = require('print');
	var _ = require('underscore');

	var Input = require('./input');
	var Engine = require('./engine');

	var Game = Engine.createWorld({
		canvas: 'canvas',
		width: 800,
		height: 800
	});

	Input.mapKey(71, function () {
		Engine.toggleGrid();
	});

	Input.mapKey(68, function () {
		Engine.toggleDebug();
	});

	Input.mapMouse(Input.LEFT_CLICK, function () {
		Engine.placeBox();
	});

});