'use strict';

var test = require('tape');
var babel = require('babel-core');

var pluginPath = require.resolve('..');

test('plugin should extract annotated functions', function (t) {
    var output = babel.transformFileSync(__dirname + '/fixtures/sample1.js', {
        plugins: [pluginPath]
    });
    console.log(output.code);
    t.pass();
    t.end();
});