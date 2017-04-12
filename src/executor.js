const bluebird = require('bluebird');
const babel = require('babel-core');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const fx = require('mkdir-recursive');
const rread = require('readdir-recursive');
const shell = require('shelljs');

const pluginPath = require.resolve('./parser');

const localpath = `${__dirname}/`;

const readdir = bluebird.promisify(fs.readdir);

class Executor {

	run(options) {
		console.log(options['output-dir']);
		// const stagedir = this.stageOutputDir(options['output-dir']);
		// stagedir.then(() => {
		switch(options.mode) {
			case 'extract-cloud': {
				this.extractCloud(options);
				break;
			}
			case 'deploy-cloud': {
				this.deployCloud(options)
				.then((fnInfo) => this.prepareLocal());
				break;
			}
			case 'prepare-local': {
				this.prepareLocal(options);
				break;
			}
			case 'live': {
				this.extractCloud(options)
					.then(() => this.deployCloud(options))
					.then((fnInfo) => this.prepareLocal(options, fnInfo));
				break;
			}
			default: {
				throw new Error(`Unrecognized mode ${options.mode}`);
			}
		}
	}
	// }).catch((err) => console.log(err));

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
		return new Promise((resolve,reject) => {
			setTimeout(() => {

				const outputPath = path.resolve(options['output-dir']);
				const name_uri = {};
				const getUri = (stdout) => {
					const info = stdout.toString().split('\n');
					for (var i = 0; i < info.length; i++) {
						if (info[i] == 'endpoints:') {
							const endpoints = info[i + 1];
							var uri = endpoints.slice(9,endpoints.length);
							return uri;
						}
					}
				};

				const dirs = p => fs.readdirSync(p).filter(f => fs.statSync(p + '/' + f).isDirectory());
				let fnFolders = dirs(outputPath);
				fnFolders = fnFolders.map((f) => outputPath + '/' + f);

				const promises = fnFolders.map((folder) => {
					console.log(`Deploying from ${folder}`);
					return new Promise((resolve,reject) => {
						shell.exec(`cd ${folder} && serverless deploy`, (code, stdout, stderr) => {
							const parts = folder.split('/');
							name_uri[parts[parts.length - 1]] = getUri(stdout);
							resolve();
						});
					});
				});

				Promise.all(promises).then(() => {
					console.log(`Done deploying, collected: ${JSON.stringify(name_uri)}`);
					resolve(name_uri);
				});

			}, 4000);
		});
	}

	// Runs the plugin in prepare mode passing as argument the URIs of the
	// previously deployed functions
	prepareLocal(options, fnInfo) {
		// if (!fnInfo) {
		//     fnInfo = {};
		// }
		console.log('now prepareLocal');
		console.log(fnInfo);
		const input_Path = path.resolve(options['input-dir']);
		const promise = rread.file(input_Path, (file) => {
			const transformed = babel.transformFileSync(file, {
				plugins: [
					[ pluginPath, { mode: 'prepare', output: localpath, uris: fnInfo }]
				],
			});
			fs.writeFileSync(`${input_Path}/local.js`, beautifier(transformed.code));
			// TODO Replace this
			// console.log(transformed.code);
		});
		// promise.then((transformed) =>fs.writeFileSync(`${input_Path}/local.js`, beautifier(transformed.code)));
	}

}

module.exports = Executor;