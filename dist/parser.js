'use strict';

var _ = require('lodash');
var beautifier = require('js-beautify').js;
var fs = require('fs');
var generate = require('babel-generator');
var fx = require('mkdir-recursive');
var yaml = require('js-yaml');
var bluebird = require('bluebird');
var babylon = require('babylon');

var body = '';

var mkdir = bluebird.promisify(fx.mkdir);
module.exports = function (_ref) {
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
		var fnArgs = _.map(node.params, function (param) {
			return param.name;
		});

		_.forEach(fnArgs, function (arg) {
			var parseObj = t.variableDeclarator(t.identifier('parsed_' + arg), t.identifier('JSON.parse(event.body)'));
			var actualVar = t.variableDeclarator(t.identifier(arg), t.identifier('parsed_' + arg + '.' + arg));
			var declaration_obj = t.variableDeclaration('var', [parseObj]);
			var declaration = t.variableDeclaration('var', [actualVar]);
			node.body.body.unshift(declaration);
			node.body.body.unshift(declaration_obj);
			// const actualVar = t.variableDeclarator(t.identifier(arg), t.identifier(`event.${arg}`));
			// const declaration = t.variableDeclaration('var', [actualVar]);
		});

		var functionName = node.id.name;
		var lambda = '\n\t\t\t\'use strict;\'\n\t\t\tmodule.exports.' + functionName + ' = function(event, context, callback)' + astToSourceString(node.body) + '\n\t\t';
		return lambda;
	};

	var decorateAsFnInvocation = function decorateAsFnInvocation(node, uri) {

		var fnArgs = _.map(node.params, function (param) {
			return param.name;
		});
		var body = '{ ' + _.map(fnArgs, function (arg) {
			return '"' + arg + '": ' + arg;
		}).join(',') + ' }';
		var decorated = '\n\t\tfunction ' + node.id.name + '(' + fnArgs.join(',') + ') {\n\t\t\tconst rp = require(\'request-promise\');\n\t\t\tconst options = {\n\t\t\t\tmethod: \'POST\',\n\t\t\t\turi:\'' + uri + '\',\n\t\t\t\tbody: ' + body + ',\n\t\t\t\tjson: true\n\t\t\t};\n\t\t\treturn rp(options).then(function(response) {\n\t\t\t\t// console.log(response);\n\t\t\t\treturn response;\n\t\t\t}).catch(function(error) {\n\t\t\t\tconsole.log(error);\n\t\t\t\tthrow error;\n\t\t\t});\n\t\t}';

		return decorated;
	};

	var createServerlessDeployment = function createServerlessDeployment(name) {
		var data = yaml.dump({
			service: 'my' + name,
			provider: { name: 'aws', runtime: 'nodejs4.3' },
			functions: {
				name: {
					handler: name + '.' + name,
					events: [{ http: { path: name, method: 'POST' } }]
				}
			}
		});
		return data;
	};

	// visitor used to replace the returned reqeust to callback function. 
	var return_visitor = {
		ReturnStatement: function ReturnStatement(path) {
			var value = path.node.argument.arguments[0].name;
			path.replaceWithSourceString('callback(null,{"statusCode": 200,"body":JSON.stringify(' + value + ')})');
		}
	};

	return {
		pre: function pre(state) {
			// Holds the content of the functions annotated with @cloud
			this.lambdas = {};
			this.mode = '';
			this.output = '';
			this.uris = {};
		},


		visitor: {
			FunctionDeclaration: function FunctionDeclaration(path, state) {
				if (isCloudFunction(path.node)) {

					this.mode = state.opts.mode;
					this.output = state.opts.output;
					this.uris = state.opts.uris;
					var name = path.node.id.name;

					switch (this.mode) {
						case 'extract':
							console.log('[Extract] - Function "' + name + '" is annotated with @cloud. Removing from AST');
							path.traverse(return_visitor);
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
							console.log('[Prepare] - Function "' + name + '" is annotated with @cloud. Replacing implementation by function invocation');
							var decoratedLocal = decorateAsFnInvocation(path.node, this.uris[name]);
							var ast = babylon.parse(decoratedLocal);
							path.replaceWith(ast);
							break;
						default:
							throw Error('Unrecognized mode ' + mode + '. Valid options are ["extract", "prepare"]');
					}
				}
			}
		},
		post: function post(state) {

			var self = this;

			switch (self.mode) {
				case 'extract':
					if (!self.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc
						throw Error('Output folder is not defined');
					}
					var writeLambdas = function writeLambdas() {
						var names = _.keys(self.lambdas);
						console.log('[Extract] - Found ' + names.length + ' annotated functions');
						_.forEach(names, function (name) {
							var functionPath = self.output + '/' + name;
							mkdir(functionPath).then(function () {
								console.log('[Extract] - Writing content and deployment info to ' + functionPath);
								fs.writeFileSync(functionPath + '/' + name + '.js', beautifier(self.lambdas[name]));
								fs.writeFileSync(functionPath + '/serverless.yml', createServerlessDeployment(name));
							}).catch(function (err) {
								console.log(err);
							});
						});
					};

					mkdir('' + self.output).then(function () {
						return writeLambdas();
					});
					break;
				case 'prepare':
					// No-op, at least so far
					break;
				default:
					if (_.keys(self.lambdas).length > 0) {
						throw Error('Unrecognized mode [' + self.mode + ']. Valid options are ["extract", "prepare"]');
					}
			}
		}
	};
};