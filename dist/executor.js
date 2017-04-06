'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var bluebird = require('bluebird');
var babel = require('babel-core');
var beautifier = require('js-beautify').js;
var fs = require('fs');
var fx = require('mkdir-recursive');
var rread = require('readdir-recursive');
var pluginPath = require.resolve('./parser');
var shell = require('shelljs');
var localpath = __dirname + '/';

var readdir = bluebird.promisify(fs.readdir);

var Executor = function () {
    function Executor() {
        _classCallCheck(this, Executor);
    }

    _createClass(Executor, [{
        key: 'run',
        value: function run(options) {
            var _this = this;

            console.log(options['output-dir']);
            // const stagedir = this.stageOutputDir(options['output-dir']);
            // stagedir.then(() => {
            switch (options.mode) {
                case 'extract-cloud':
                    this.extractCloud(options);
                    break;
                case 'deploy-cloud':
                    this.deployCloud(options).then(function (fnInfo) {
                        return _this.prepareLocal();
                    });
                    break;
                case 'prepare-local':
                    this.prepareLocal(options);
                    break;
                case 'live':
                    this.extractCloud(options).then(function () {
                        return _this.deployCloud(options);
                    }).then(function (fnInfo) {
                        return _this.prepareLocal(options, fnInfo);
                    });
                    break;
                default:
                    throw new Error('Unrecognized mode ' + options.mode);
            }
            // }).catch((err) => console.log(err));
        }
    }, {
        key: 'stageOutputDir',
        value: function stageOutputDir(dir) {
            return new Promise(function (resolve, reject) {
                fs.stat(dir, function (err, stats) {
                    if (err) {
                        // Doesn't exist
                        fx.mkdir(dir, function (err) {
                            return resolve();
                        });
                    } else {
                        reject('The directory ' + dir + ' already exists, please provide a new directory');
                    }
                });
            });
        }

        // Runs the plugin in extract mode creating a folder per AWS
        // lambda that needs to be deployed

    }, {
        key: 'extractCloud',
        value: function extractCloud(options) {
            var inputPath = path.resolve(options['input-dir']);
            console.log('Reading input directory [' + inputPath + ']');
            var files = rread.fileSync(inputPath);
            var promises = files.map(function (file) {
                console.log('Processing file: ' + file);
                babel.transformFileSync(file, {
                    plugins: [[pluginPath, { mode: 'extract', output: options['output-dir'] }]]
                });
                return Promise.resolve();
            });
            return Promise.all(promises);
        }

        // Runs the serverless tool in each folder created in the extractCloud
        // step. Returns a map containing function names and URIs

    }, {
        key: 'deployCloud',
        value: function deployCloud(options) {
            return new Promise(function (resolve, reject) {
                setTimeout(function () {

                    var outputPath = path.resolve(options['output-dir']);
                    var name_uri = {};
                    var getUri = function getUri(stdout) {
                        var info = stdout.toString().split("\n");
                        for (var i = 0; i < info.length; i++) {
                            if (info[i] == 'endpoints:') {
                                var endpoints = info[i + 1];
                                var uri = endpoints.slice(9, endpoints.length);
                                return uri;
                            }
                        }
                    };

                    var dirs = function dirs(p) {
                        return fs.readdirSync(p).filter(function (f) {
                            return fs.statSync(p + '/' + f).isDirectory();
                        });
                    };
                    var fnFolders = dirs(outputPath);
                    fnFolders = fnFolders.map(function (f) {
                        return outputPath + '/' + f;
                    });

                    var promises = fnFolders.map(function (folder) {
                        console.log('Deploying from ' + folder);
                        return new Promise(function (resolve, reject) {
                            shell.exec('cd ' + folder + ' && serverless deploy', function (code, stdout, stderr) {
                                var parts = folder.split('/');
                                name_uri[parts[parts.length - 1]] = getUri(stdout);
                                resolve();
                            });
                        });
                    });

                    Promise.all(promises).then(function () {
                        console.log('Done deploying, collected: ' + JSON.stringify(name_uri));
                        resolve(name_uri);
                    });
                }, 4000);
            });
        }

        // Runs the plugin in prepare mode passing as argument the URIs of the
        // previously deployed functions

    }, {
        key: 'prepareLocal',
        value: function prepareLocal(options, fnInfo) {
            // if (!fnInfo) {
            //     fnInfo = {};
            // }
            console.log('now prepareLocal');
            console.log(fnInfo);
            var input_Path = path.resolve(options['input-dir']);
            var promise = rread.file(input_Path, function (file) {
                var transformed = babel.transformFileSync(file, {
                    plugins: [[pluginPath, { mode: 'prepare', output: localpath, uris: fnInfo }]]
                });
                fs.writeFileSync(input_Path + '/local.js', beautifier(transformed.code));
                // TODO Replace this
                // console.log(transformed.code);
            });
            // promise.then((transformed) =>fs.writeFileSync(`${input_Path}/local.js`, beautifier(transformed.code)));
        }
    }]);

    return Executor;
}();

module.exports = Executor;