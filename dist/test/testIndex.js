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

var scratchDir = __dirname + '/scratch';
var generatedFiles = [];

test('staging', function (t) {
    fs.stat(scratchDir, function (err, stats) {
        if (err) {
            // Doesn't exist
            fx.mkdir(scratchDir, function (err) {
                if (err) {
                    t.end(err);
                };
                t.pass('Created scratch dir');
                t.end();
            });
        } else {
            // cloud folder already exists check
            t.pass('Scratch dir already exists');
            t.end();
        }
    });
});

test('plugin should extract annotated functions', function (t) {
    babel.transformFileSync(__dirname + '/fixtures/main.js', {
        plugins: [[pluginPath, { mode: 'extract', output: scratchDir }]]
    });
    t.pass('Plugin runs without crashing');
    t.end();
});

test('plugin should be able to extract a simple function annotated with @cloud', function (t) {

    var input = '\n        /* @cloud */\n        function myAnnotatedFn() {}\n\n        function notAnnotated() {}\n    ';
    var expectedString = '\n        \'use strict;\'\n        module.exports.myAnnotatedFn = function(event, context, callback)\n        \n        {}\n    ';

    var fixtureName = __dirname + '/fixtures/' + uuid.v4() + '.js';
    var expectedName = __dirname + '/fixtures/' + uuid.v4() + '.js';

    fs.writeFileSync(fixtureName, input);
    fs.writeFileSync(expectedName, beautifier(expectedString));

    generatedFiles.push(fixtureName);
    generatedFiles.push(expectedName);

    var output = babel.transformFileSync(fixtureName, {
        plugins: [[pluginPath, { mode: 'extract', output: scratchDir }]]
    });

    // Little hack to wait until the post step is done.
    // For some reason the post step execution is not included
    // in the transformFile fn.
    setTimeout(function () {
        var actual = fs.readFileSync(scratchDir + '/myAnnotatedFn/myAnnotatedFn.js').toString();
        var expected = fs.readFileSync(expectedName).toString();
        t.equal(actual, expected);
        t.end();
    }, 1000);
});

test('teardown - remove the scratch folder', function (t) {
    rmdir(scratchDir, function (err) {
        if (err) {
            t.fail(err);
        }
        _.forEach(generatedFiles, function (file) {
            return fs.unlinkSync(file);
        });
        t.pass();
        t.end();
    });
});