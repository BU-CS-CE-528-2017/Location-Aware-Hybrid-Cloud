const _ = require('lodash');
const babel = require('babel-core');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const fx = require('mkdir-recursive');
const rmdir = require('rmdir');
const test = require('tape');
const yaml = require('js-yaml');
const uuid = require('uuid');

const pluginPath = require.resolve('../parser');

const scratchDir = `${__dirname}/scratch/`;
const generatedFiles = [];

test('plugin should get local.js ', (t) => {
  fx.mkdirSync(scratchDir);
  const output = babel.transformFileSync(`${__dirname}/fixtures/main.js`, {
    plugins: [[pluginPath, { mode: 'prepare', output: scratchDir, uris: { calcPrimes: 'https://some.aws.com/uri' } }]],
  });
  t.pass('Plugin runs without crashing');
  fs.writeFileSync(`${scratchDir}local.js`, output.code);
  fs.unlinkSync(`${scratchDir}local.js`);
  fs.rmdirSync(scratchDir);
  t.end();
});
