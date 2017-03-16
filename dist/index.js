'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (_ref) {
	var t = _ref.types;


	var isCloudFunction = function isCloudFunction(node) {
		var comments = _.map(node.leadingComments, function (comment) {
			return comment.value;
		});
		return _.some(comments, function (comment) {
			return comment.match(/@cloud/);
		});
	};

	// Takes a node from the AST and converts it to
	// its string representation
	var astToSourceString = function astToSourceString(node) {
		var options = {
			retainLines: true
		};
		var source = generate.default(node, options);
		return source.code;
	};

	// Wraps a node as an AWS lambda function
	var decorateAsLambda = function decorateAsLambda(node) {
		// This is what a lambda function would normally look like
		// TODO Here we are just naively taking the code in the node and
		// wrapping it in another function. We still need to pass the 
		// arguments from event to the function signature if it 
		// accepts any.

		var function_name = node.id.name;
		var body = astToSourceString(node.body).slice(5, -1);
		var lambda = '\n\t\t\t\'use strict;\'\n\n\t\t\tmodule.exports.' + function_name + ('= function(event, context, callback){\n\t\t\t\tvar n = event.n;\n\t\t\t\t' + body + '\n\t\t\t}\n\t\t');
		return lambda;
	};

	var decorateAsFnInvocation = function decorateAsFnInvocation(node) {
		// TODO This will be called when run in prepare mode
	};

	var decorateAsRequest = function decorateAsRequest(node) {
		var function_name = node.id.name;
		var request = 'const rp = require(\'request-promise\');\n\t\t\tnumber = process.argv[2];\n\t\t\tconst options = {\n\t\t\t\tmethod: \'GET\',\n\t\t\t\turi:\'https://909obvouza.execute-api.us-west-2.amazonaws.com/Trial\',\n\t\t\t\t    qs: {\n\t\t\t\t      n : number\n\t\t\t\t    },\n   \t\t\t\t\tjson: true\n\t\t\t}\n\t\t\trp(options)\n\t\t\t.then(function(response){\n\t\t\t\t' + function_name + '(response);\n\t\t\t})\n\t\t\t.catch(function(error){\n\t\t\t\tconsole.log(error);\n\t\t\t})' + astToSourceString(node);

		return request;
	};
	var return_Visitor = {
		ReturnStatement: function ReturnStatement(path) {
			var return_value = path.node.argument.name;
			path.replaceWithSourceString('callback(null,' + return_value + ')');
		}
	};
	return {
		pre: function pre(state) {
			// Holds the content of the functions annotated with @cloud
			this.lambdas = {};
			this.mode = '';
			this.output = '';
			this.local = '';
		},


		visitor: {
			FunctionDeclaration: function FunctionDeclaration(path, state) {
				if (isCloudFunction(path.node)) {

					this.mode = state.opts.mode;
					this.output = state.opts.output;
					var name = path.node.id.name;

					switch (this.mode) {
						case 'extract':
							console.log('[Extract] - Function "' + name + '" is annotated with @cloud. Removing from AST');
							path.traverse(return_Visitor);
							var decorated = decorateAsLambda(path.node);
							if (this.lambdas[name]) {
								// TODO We should probably include the filename in the name, that
								// way we eliminate the chances of having duplicate functions.
								throw Error('Duplication function ' + name);
							}
							this.lambdas[name] = decorated;
							path.remove();
							break;
						case 'prepare':
							// TODO Write similar code to extract. Only here, instead of removing the node from the
							// AST, we wrap it in an invocation (actually calling the lambda function)
							break;
						default:
							throw Error('Unrecognized mode ' + mode + '. Valid options are ["extract", "prepare"]');
					}
				} else {
					this.local = decorateAsRequest(path.node);
				}
			}
		},
		post: function post(state) {

			var self = this;

			switch (self.mode) {
				case 'extract':
					if (!self.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc.
						throw Error('Output folder is not defined');
					}
					var writeLambdas = function writeLambdas() {
						var names = _.keys(self.lambdas);
						console.log('[Extract] - Found ' + names.length + ' annotated functions');
						_.forEach(names, function (name) {
							console.log('[Extract] - Writing to ' + self.output + '/' + name + '.js}');
							var function_path = self.output + 'aws/';
							fx.mkdir(function_path, function (err) {
								if (err) {
									console.log('error when generate the folder');
									throw err;
								}
								fs.writeFileSync('' + function_path + name + '.js', beautifier(self.lambdas[name]));
							});
						});
					};

					var writelocal = function writelocal() {
						console.log('[Extract] - Writing to ' + self.output + '/local.js}');
						fs.writeFileSync(self.output + '/local.js', beautifier(self.local));
					};

					fs.stat(self.output, function (err, stats) {
						if (err) {
							// Doesn't exist
							fx.mkdir(self.output, function (err) {
								if (err) {
									throw err;
								}
								writeLambdas();
								writelocal();
							});
							return;
						}
						if (!stats.isDirectory()) {
							// This isn't a directory!
							callback(new Error(self.output + ' exists and is not a directory.'));
						} else {
							writeLambdas();
							writelocal();
						}
					});
					break;
				case 'prepare':
					// No-op, at least so far
					break;
				default:
					throw Error('Unrecognized mode ' + mode + '. Valid options are ["extract", "prepare"]');
			}
		}
	};
};

var _babelTraverse = require('babel-traverse');

var _babelTraverse2 = _interopRequireDefault(_babelTraverse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var beautifier = require('js-beautify').js;
var fs = require('fs');
var generate = require('babel-generator');
var fx = require('mkdir-recursive');