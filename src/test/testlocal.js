const _ = require('lodash');
const babel = require('babel-core');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const fx = require('mkdir-recursive');
const rmdir = require('rmdir');
const test = require('tape');
const yaml = require('js-yaml');
const uuid = require('uuid');

const pluginPath = require.resolve('..');

const scratchDir = `${__dirname}/scratch/`;
const generatedFiles = [];

test('plugin should get local.js ', (t) => {
    var output = babel.transformFileSync(__dirname + '/Application/main.js', {
        plugins: [[pluginPath, { mode: 'prepare', output: scratchDir }]]
    });
    t.pass('Plugin runs without crashing');
    fs.writeFileSync(scratchDir +'local.js', output.code);
    t.end();
});