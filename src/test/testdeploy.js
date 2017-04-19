const test = require('tape');
const Executor = require('../executor');
const options = {
  mode: 'test',
  'input-dir': './test/fixtures',
  'output-dir': './testcloud',
};

test('deploy-cloud should deploy the sample cloud function in test cloud folder', (t) => {
  const executor = new Executor();
  executor.run(options);
  t.pass('deploy function runs without crashing');
  t.end();
});

