const babel = require('babel-core');
const fs = require('fs');
const fx = require('mkdir-recursive');
const rread = require('readdir-recursive');
const pluginPath = require.resolve('./parser');
const bluebird = require('bluebird');
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
                  this.extractCloud(options).then(() =>
                        this.deployCloud(options))
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
       return readdir(inputPath, (err,file) => {
        file.forEach((doc) => {
            doc = `${inputPath}/${doc}`
           babel.transformFileSync(doc, {
               plugins: [
                   [ pluginPath, { mode: 'extract', output: options['output-dir'] } ]
               ],
           });
       });
       });
   }
    // Runs the serverless tool in each folder created in the extractCloud
    // step. Returns a map containing function names and URIs
    deployCloud(options) {
        console.log('not my guo')
        const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(p+"/"+f).isDirectory());
        const output_dir = options['output-dir'];
        const files = dirs(output_dir);
        const name_uri = {};
        return new Promise((resolve) => {
        files.forEach((file) => {
            shell.cd(file);
            shell.exec('serverless deploy');
            console.log(file)
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
            });
        }); resolve();
    })
    }


    // Runs the plugin in prepare mode passing as argument the URIs of the
    // previously deployed functions
    prepareLocal(options,fnInfo) {
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