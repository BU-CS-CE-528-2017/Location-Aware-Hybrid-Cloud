const parser = require('./parser');
const Executor = require('./executor');
const yargonaut = require('yargonaut').style('blue');
const yargs = require('yargs');
 
const yargOptions = {
    mode: {
        alias: 'm',
        describe: 'Mode in which to run the CLI',
        default: 'live',
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
}

const options = require('yargs')
  .options(yargOptions)
  .example('$0 --mode live --input-dir ./files --output-dir ./cloud', 'Extracts the cloud annotated functions of the current directory, deploys them to AWS and prepares the local files')
  .wrap(null)
  .help()
  .argv

const executor = new Executor();
executor.run(options);