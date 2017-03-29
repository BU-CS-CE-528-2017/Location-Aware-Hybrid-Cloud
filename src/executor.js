const bluebird = require('bluebird');
const babel = require('babel-core');
const fs = require('fs');
const fx = require('mkdir-recursive');
const rread = require('readdir-recursive');
const pluginPath = require.resolve('./parser');
const shell = require('shelljs');
const localpath = `${__dirname}/`;

const readdir = bluebird.promisify(fs.readdir);

class Executor {

    run(options) {
        console.log(options['output-dir'])
        const stagedir = this.stageOutputDir(options['output-dir']);
        stagedir.then(() => {
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
                case 'test':
                    this.extractCloud(options);
                    this.deployCloud(options);
                    break;
                case 'live':
                    this.extractCloud(options)
                        .then(() => this.deployCloud(options))
                        .then((fnInfo) => this.prepareLocal(options));
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
        console.log(`Reading input directory [${inputPath}]`);
        const files = rread.fileSync(inputPath);
        const promises = files.map((file) => {
            console.log(`Processing file: ${file}`);
            babel.transformFileSync(file, {
                plugins: [ [ pluginPath, { mode: 'extract', output: options['output-dir'] } ] ],
            });
            return Promise.resolve();
        });
        return Promise.all(promises);
    }

    // Runs the serverless tool in each folder created in the extractCloud
    // step. Returns a map containing function names and URIs
    deployCloud(options) {
        const outputPath = path.resolve(options['output-dir']);
        // console.log(outputPath)
        // const dirs = p => readdir(p).filter(f => fs.stat(p+"/"+f).isDirectory());
        // const files = dirs(outputPath);
        // console.log(files)
        const name_uri = {};
        const test_files = ['./cloud/calcPrimes']
        const deploy_promises = test_files.map((file) =>{
              console.log(`deploying the ${file}`)
              shell.cd(file);
              console.log(`${__dirname}/`)
              shell.exec('serverless deploy');
              shell.cd(localpath)
              return Promise.resolve();
        });
      Promise.all(deploy_promises).then(() =>{
            console.log(`getting the serverless information`)
            const info_promises = files.map((file) =>{
                shell.cd(file);
                shell.exec('serverless info',(code,stdout,stderr) => {
                if(code != '0'){
                    console.log(stderr)
                }else{
                    const info = stdout.toString().split("\n");
                    for(var i = 0; i < info.length; i++) {
                        if(info[i] == 'endpoints:'){
                            const endpoints = info[i + 1];
                            var uri = endpoints.slice(9,-1);
                            name_uri[file] = uri;
                        }
                    }
                }
        })
                shell.cd(localpath);
                return Promise.resolve();
            })
            return Promise.all(info_promises);
        })
      return Promise.resolve(name_uri)
    }


    // Runs the plugin in prepare mode passing as argument the URIs of the
    // previously deployed functions
    prepareLocal(options) {
        if (!fnInfo) {
            fnInfo = {};
        }
        const input_Path = path.resolve(options['input-dir']);
        rread.file(input_Path, (file) => {
            babel.transformFileSync(file, {
                plugins: [
                    [ pluginPath, { mode: 'prepare', output: localpath, uris:fnInfo}]
                ],
            });
        });
    }

}

module.exports = Executor;