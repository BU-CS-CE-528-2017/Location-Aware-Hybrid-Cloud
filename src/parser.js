const _ = require('lodash');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const generate = require('babel-generator');
const fx = require('mkdir-recursive');
const yaml = require('js-yaml');
const bluebird = require('bluebird');
const babylon = require('babylon');

var body = '';

const mkdir = bluebird.promisify(fx.mkdir);
module.exports = function ({types: t}) {

	const isCloudFunction = (node) => {
		const comments = _.map(node.leadingComments, (comment) => comment.value);
		return _.some(comments, (comment) => comment.match(/@cloud/));
	};

	// Takes a node from the AST and converts it to
	// its string representation
	const astToSourceString = (node) => {
		const options = {
			retainLines: true
		};
		const source = generate.default(node, options);
		return source.code;
	};

	// Wraps a node as an AWS lambda function
	const decorateAsLambda = (node) => {
		const fnArgs = _.map(node.params, (param) => param.name);

		_.forEach(fnArgs, (arg) => {
			const parseObj = t.variableDeclarator(t.identifier('parsed_${arg}'),t.identifier('JSON.parse(event.body)'));
			const actualVar = t.variableDeclarator(t.identifier(arg), t.identifier(`parsed_${arg}.${arg}`));
			const declaration_obj =	t.variableDeclaration('var',[parseObj]);
			const declaration = t.variableDeclaration('var',[actualVar]);
			node.body.body.unshift(declaration);
			node.body.body.unshift(declaration_obj);
			// const actualVar = t.variableDeclarator(t.identifier(arg), t.identifier(`event.${arg}`));
			// const declaration = t.variableDeclaration('var', [actualVar]);
		});

		const functionName = node.id.name;
		const lambda = `
			'use strict;'
			module.exports.${functionName} = function(event, context, callback)${astToSourceString(node.body)}
		`;
		return lambda;
		
	};

	const decorateAsFnInvocation = (node, uri) => {

		const fnArgs = _.map(node.params, (param) => param.name);
		const body = `{ ${_.map(fnArgs, (arg) => `"${arg}": ${arg}`).join(',')} }`;
		const decorated = `
		function ${node.id.name}(${fnArgs.join(',')}) {
			const rp = require('request-promise');
			const options = {
				method: 'POST',
				uri:'${uri}',
				body: ${body},
				json: true
			};
			return rp(options).then(function(response) {
				// console.log(response);
				return response;
			}).catch(function(error) {
				console.log(error);
				throw error;
			});
		}`;

		return decorated;
	};

	const createServerlessDeployment = (name) => {
		const data = yaml.dump({ 
			service: `my${name}`,
			provider: { name: 'aws', runtime: 'nodejs4.3' },
			functions: { 
				name: { 
					handler: `${name}.${name}`,
					events: [ { http: { path: name, method: 'POST' } } ] 
				} 
			} 
		});
		return data;
	};

	// visitor used to replace the returned reqeust to callback function. 
	const return_visitor ={
		ReturnStatement(path){
			const value = path.node.argument.arguments[0].name;
			path.replaceWithSourceString(`callback(null,{"statusCode": 200,"body":JSON.stringify(${value})})`);
		}
	};

	return {
		pre(state) {
			// Holds the content of the functions annotated with @cloud
			this.lambdas = {};
			this.mode = '';
			this.output = '';
			this.uris = {};
		},

		visitor: {
			FunctionDeclaration(path, state) {
				if (isCloudFunction(path.node)) {

					this.mode = state.opts.mode;
					this.output = state.opts.output;
					this.uris = state.opts.uris;
					const name = path.node.id.name;

					switch(this.mode) {
						case 'extract': {
							console.log(`[Extract] - Function "${name}" is annotated with @cloud. Removing from AST`);
							path.traverse(return_visitor);
							const decorated = decorateAsLambda(path.node);
							if (this.lambdas[name]) {
								// TODO We should probably include the filename in the name, that
								// way we eliminate the chances of having duplicate functions.
								throw Error(`Duplication function ${name}`);
							}
							this.lambdas[name] = decorated;
							path.remove();
							break;
						}
						case 'prepare': {
							console.log(`[Prepare] - Function "${name}" is annotated with @cloud. Replacing implementation by function invocation`);
							const decoratedLocal = decorateAsFnInvocation(path.node, this.uris[name]);
							const ast = babylon.parse(decoratedLocal);
							path.replaceWith(ast);
							break;
						}
						default: {
							throw Error(`Unrecognized mode ${this.mode}. Valid options are ["extract", "prepare"]`);
						}
					}
				}

			}
		},
		post(state) {

			const self = this;

			switch(self.mode) {
				case 'extract': {
					if (!self.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc
						throw Error('Output folder is not defined');
					}
					const writeLambdas = () => {
						const names = _.keys(self.lambdas);
						console.log(`[Extract] - Found ${names.length} annotated functions`);
						_.forEach(names, (name) => {
							const functionPath = `${self.output}/${name}`;
							mkdir(functionPath)
								.then(() => {
									console.log(`[Extract] - Writing content and deployment info to ${functionPath}`);
									fs.writeFileSync(`${functionPath}/${name}.js`, beautifier(self.lambdas[name]));
									fs.writeFileSync(`${functionPath}/serverless.yml`, createServerlessDeployment(name));
								})
								.catch((err) => {
									console.log(err);
								});
						});
					};

					mkdir(`${self.output}`).then(() => writeLambdas());
					break;
				}
				case 'prepare': // No-op, at least so far
					break;		
				default: {
					if (_.keys(self.lambdas).length > 0) {
						throw Error(`Unrecognized mode [${self.mode}]. Valid options are ["extract", "prepare"]`);
					}
				}	
			}
		}
	};
};