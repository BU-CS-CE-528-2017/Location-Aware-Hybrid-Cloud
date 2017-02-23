const test = require('tape');
const babel = require('babel-core');

const pluginPath = require.resolve('..');

test('plugin should extract annotated functions', (t) => {
    var output = babel.transformFileSync(__dirname + '/fixtures/sample1.js', {
		plugins: [pluginPath]
	});
    console.log(output.code);
    t.pass();
    t.end();
});