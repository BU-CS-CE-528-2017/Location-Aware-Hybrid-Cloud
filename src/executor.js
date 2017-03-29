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
        // const stagedir = this.stageOutputDir(options['output-dir']);
        // stagedir.then(() => {
            switch(options.mode) {
                case 'extract-cloud':
                    this.extractCloud(options);
                    break;
                case 'deploy-cloud':
                    this.deployCloud(options)
                    .then((fnInfo) => this.prepareLocal())
                    break;
                case 'prepare-local':
                    this.prepareLocal(options);
                    break;
                case 'live':
                    this.extractCloud(options)
                        .then(() => this.deployCloud(options)).then((fnInfo) => 
                        this.prepareLocal(options));
                    break;
                default:
                    throw new Error(`Unrecognized mode ${options.mode}`);
                }
        // }).catch((err) => console.log(err));
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
      return new Promise((resolve,reject)=> setTimeout(() =>{
        const outputPath = path.resolve(options['output-dir']);
        const name_uri = {};
        const getUri = (stdout) => { 
            const info = stdout.toString().split("\n");
            for(var i = 0; i < info.length; i++) {
                if(info[i] == 'endpoints:'){
                    const endpoints = info[i + 1];
                    var uri = endpoints.slice(9,-1);
                    return uri;
                }
            }
        }  
        const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(p+"/"+f).isDirectory())
        const files = dirs(outputPath);
        for(var i=0, l=files.length; i<l; i++){
            files[i] = outputPath +'/' +files[i];
        }
        const promises = files.map((file) => {
                console.log(`deploying the ${file}`)
                shell.cd(file);
                return new Promise((resolve,reject) => shell.exec('serverless deploy',(code,stdout,stderr) => {
                name_uri[file] = getUri(stdout);
                shell.cd(localpath)
                resolve();
            })
                )
        });
        // console.log(promises)
        Promise.all(promises).then(()=>resolve(name_uri))
    },4000)
    )}

    // Runs the plugin in prepare mode passing as argument the URIs of the
    // previously deployed functions
    prepareLocal(options) {
        // if (!fnInfo) {
        //     fnInfo = {};
        // }
        console.log('now prepareLocal')
        console.log(fnInfo)
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