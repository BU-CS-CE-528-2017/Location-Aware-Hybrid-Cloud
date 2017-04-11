'use strict';

var parser = require('./parser');
var Executor = require('./executor');
//const yargonaut = require('yargonaut').style('blue');

var yargOptions = {
	mode: {
		alias: 'm',
		describe: 'Mode in which to run the CLI',
		default: 'extract-cloud',
		demand: true,
		choices: ['extract-cloud', 'deploy-cloud', 'prepare-local', 'live'],
		type: 'string'
	},
	'input-dir': {
		alias: 'i',
		default: './files',
		describe: 'Root directory containing the code to be parsed and deployed',
		demand: true,
		type: 'string'
	},
	'output-dir': {
		alias: 'd',
		default: './cloud',
		describe: 'Target directory where the CLI outputs all the runnable files',
		demand: true,
		type: 'string'
	}
};

var options = require('yargs').options(yargOptions).example('$0 --mode live --input-dir ./files --output-dir ./cloud', 'Extracts the cloud annotated functions of the current directory, deploys them to AWS and prepares the local files').wrap(null).help().argv;

var executor = new Executor();
executor.run(options);