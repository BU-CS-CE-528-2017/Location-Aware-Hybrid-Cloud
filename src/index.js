const _ = require('lodash');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const generate = require('babel-generator');
const fx = require('mkdir-recursive');
import traverse from "babel-traverse";

export default function({types: t}){

	const isCloudFunction = (node) => {
		const comments = _.map(node.leadingComments, (comment) => comment.value)
		return _.some(comments, (comment) => comment.match(/@cloud/));
	}

	// Takes a node from the AST and converts it to
	// its string representation
	const astToSourceString = (node) => {
		const options = {
			retainLines: true
		};
		const source = generate.default(node, options);
		return source.code;
	}

	// Wraps a node as an AWS lambda function
	const decorateAsLambda = (node) => {
		// This is what a lambda function would normally look like
		// TODO Here we are just naively taking the code in the node and
		// wrapping it in another function. We still need to pass the 
		// arguments from event to the function signature if it 
		// accepts any.
	
 		const function_name = node.id.name;

		const lambda = `
			'use strict;'

			module.exports.` + function_name + `= function(event, context, callback)
				${astToSourceString(node.body)}
		`
		return lambda
		
	}

	const decorateAsFnInvocation = (node) => {
		// TODO This will be called when run in prepare mode
	}

	const decorateAsRequest = (node) => {
		const function_name = node.id.name;
		const request =`const rp = require('request-promise');
			const options = {
				method: 'GET',
				uri:'https://909obvouza.execute-api.us-west-2.amazonaws.com/Trial'
			}
			rp(options)
			.then(function(response){
				${function_name}(response);
			})
			.catch(function(error){
				console.log(error);
			})${astToSourceString(node)}`

			return request;
	}
	const return_Visitor = {
 			ReturnStatement(path){
			const return_value = path.node.argument.name;
			path.replaceWithSourceString(`callback(null,${return_value})`);
		}
	}
    return {
		pre(state) {
			// Holds the content of the functions annotated with @cloud
			this.lambdas = {};
			this.mode = '';
			this.output = '';
			this.local = '';
		},

        visitor: {
            FunctionDeclaration(path, state) {
				if (isCloudFunction(path.node)) {

					this.mode = state.opts.mode;
					this.output = state.opts.output;
					const name = path.node.id.name;

					switch(this.mode) {
						case 'extract':
							console.log(`[Extract] - Function "${name}" is annotated with @cloud. Removing from AST`);
							path.traverse(return_Visitor);
							const decorated = decorateAsLambda(path.node);
							if (this.lambdas[name]) {
								// TODO We should probably include the filename in the name, that
								// way we eliminate the chances of having duplicate functions.
								throw Error(`Duplication function ${name}`);
							}
							this.lambdas[name] = decorated;
							path.remove();
							break;
						case 'prepare':
							// TODO Write similar code to extract. Only here, instead of removing the node from the
							// AST, we wrap it in an invocation (actually calling the lambda function)
							break;
						default:
							throw Error(`Unrecognized mode ${mode}. Valid options are ["extract", "prepare"]`);
					}

				}else{
					this.local = decorateAsRequest(path.node);
				}

            }
        },
		post(state) {

			const self = this;

			switch(self.mode) {
				case 'extract':
					if (!self.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc.
						throw Error('Output folder is not defined');
					}
					const writeLambdas = () => {
						const names = _.keys(self.lambdas);
						console.log(`[Extract] - Found ${names.length} annotated functions`);
						_.forEach(names, (name) => {
							console.log(`[Extract] - Writing to ${self.output}/${name}.js}`);
							fs.writeFileSync(`${self.output}/${name}.js`, beautifier(self.lambdas[name]));
						});
					};

					const writelocal = () => {
						console.log(`[Extract] - Writing to ${self.output}/local.js}`);
						fs.writeFileSync(`${self.output}/local.js`, beautifier(self.local));
					};

					fs.stat(self.output, function (err, stats){
						if (err) { // Doesn't exist
							fx.mkdir(self.output, (err) => {
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
							callback(new Error(`${self.output} exists and is not a directory.`));
						} else {
							writeLambdas();
							writelocal();
						}
					});
					break;
				case 'prepare': // No-op, at least so far
					break;		
				default:
					throw Error(`Unrecognized mode ${mode}. Valid options are ["extract", "prepare"]`);
			}
		}
    }
}