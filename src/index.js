const _ = require('lodash');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const generate = require('babel-generator');
const fx = require('mkdir-recursive');

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
		const lambda = `
			'use strict;'

			exports.handler = function(event, context) {
				${astToSourceString(node)}
			}
		`
		return lambda
	}

	const decorateAsFnInvocation = (node) => {
		// TODO
	}

	const saveLambda = (outputFolder) => {

	}

    return {
		pre(state) {
			// Holds the content of the functions annotated with @cloud
			this.lambdas = {};
			this.mode = '';
			this.output = '';
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

				}
            }
        },
		post(state) {
			switch(this.mode) {
				case 'extract':
					if (!this.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc.
						throw Error('Output folder is not defined');
					}
					const writeLambdas = () => {
						const names = _.keys(this.lambdas);
						console.log(`Found ${names.length} annotated functions`);
						_.forEach(names, (name) => {
							console.log(`Writing to ${this.output}/${name}.js}`);
							fs.writeFileSync(`${this.output}/${name}.js`, beautifier(this.lambdas[name]));
						});
					};
					fs.stat(this.output, function (err, stats){
						if (err) { // Doesn't exist
							fx.mkdir(this.output, (err) => {
								if (err) {
									throw err;
								}
								writeLambdas();
							});
						}
						if (!stats.isDirectory()) {
							// This isn't a directory!
							callback(new Error(`${this.output} exists and is not a directory.`));
						} else {
							writeLambdas();
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