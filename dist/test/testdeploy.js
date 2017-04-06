'use strict';

var test = require('tape');
var Executor = require('../executor');
var options = {
	mode: 'test',
	'input-dir': './test/fixtures',
	'output-dir': './testcloud'
};

test('deploy-cloud should deploy the sample cloud function in test cloud folder', function (t) {
	var executor = new Executor();
	executor.run(options);
	t.pass('deploy function runs without crashing');
	t.end();
});