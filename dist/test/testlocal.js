'use strict';

var _ = require('lodash');
var babel = require('babel-core');
var beautifier = require('js-beautify').js;
var fs = require('fs');
var fx = require('mkdir-recursive');
var rmdir = require('rmdir');
var test = require('tape');
var yaml = require('js-yaml');
var uuid = require('uuid');

var pluginPath = require.resolve('../parser');

var scratchDir = __dirname + '/scratch/';
var generatedFiles = [];

test('plugin should get local.js ', function (t) {
    fx.mkdirSync(scratchDir);
    var output = babel.transformFileSync(__dirname + '/fixtures/main.js', {
        plugins: [[pluginPath, { mode: 'prepare', output: scratchDir, uris: { 'calcPrimes': 'https://some.aws.com/uri' } }]]
    });
    t.pass('Plugin runs without crashing');
    fs.writeFileSync(scratchDir + 'local.js', output.code);
    fs.unlinkSync(scratchDir + 'local.js');
    fs.rmdirSync(scratchDir);
    t.end();
});