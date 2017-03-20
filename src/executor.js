const babel = require('babel-core');
const fs = require('fs');
const fx = require('mkdir-recursive');
const rread = require('readdir-recursive');
const pluginPath = require.resolve('./parser');

class Executor {

    run(options) {
        this.stageOutputDir(options['output-dir']).then(() => {
            switch(options.mode) {
                case 'extract-cloud':
                    this.extractCloud(options);
                    break;
                case 'deploy-cloud':
                    this.deployCloud(options);
                    break;
                case 'prepare-local':
                    this.prepareLocal(options);
                    break;
                case 'live':
                    this.extractCloud(options)
                        .then(() => this.deployCloud())
                        .then((fnInfo) => this.prepareLocal());
                    break;
                default:
                    throw new Error(`Unrecognized mode ${options.mode}`);
                }
        }).catch((err) => console.log(err));
    }

    stageOutputDir(dir) {
        return new Promise((resolve, reject) => {
            fs.stat(dir, function (err, stats){
                if (err) { // Doesn't exist
                    fx.mkdir(dir, (err) => resolve());
                } else {
                    reject(`The directory ${dir} already exists, please provide a new directory`);
                }
            });
        });
    }



    // Runs the plugin in extract mode creating a folder per AWS
    // lambda that needs to be deployed
    extractCloud(options) {
        const inputPath = path.resolve(options['input-dir']);
        rread.file(inputPath, (file) => {
            console.log(file);
            babel.transformFileSync(file, {
                plugins: [
                    [ pluginPath, { mode: 'extract', output: options['output-dir'] } ]
                ],
            });
        });
    }

    // Runs the serverless tool in each folder created in the extractCloud
    // step. Returns a map containing function names and URIs
    deployCloud(options) {

    }

    // Runs the plugin in prepare mode passing as argument the URIs of the
    // previously deployed functions
    prepareLocal(options) {

    }

}

module.exports = Executor;