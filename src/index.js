const _ = require('lodash');
const beautifier = require('js-beautify').js;
const fs = require('fs');
const generate = require('babel-generator');
const fx = require('mkdir-recursive');
const yaml = require('js-yaml');
var body = '';
import traverse from "babel-traverse";
import * as babylon from "babylon";

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

	const decorateAsFnInvocation = (node,uri,body) => {
		// TODO This will be called when run in prepare mode
		const function_name = node.id.name;
		const request =`const rp = require('request-promise');
			const options = {
				method: 'POST',
				uri:'${uri}',
				    body: 
				      ${body}
				    ,
   					json: true
			}
			rp(options)
			.then(function(response){
				console.log(response);
			})
			.catch(function(error){
				console.log(error);
			})`

			return request;
	}


	const return_Visitor = {
 			ReturnStatement(path){
			const return_value = path.node.argument.name;
			path.replaceWithSourceString(`callback(null,${return_value})`);
		}
	}

	const object_visitor = {
		AssignmentExpression(path){
			if(path.node.left.name == this.param){
				const local_body = astToSourceString(path.node.right);
				body = local_body;
			}
		},

		Directive(path){
  			path.remove();
		}	
	}

	const assignment_visitor = {
		MemberExpression(path){
    		if(path.node.object.name == "obj"){
        		path.node.object.name = "event"
        	}
    	}
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
					const param = path.node.params[0].name;

					switch(this.mode) {
						case 'extract':
							console.log(`[Extract] - Function "${name}" is annotated with @cloud. Removing from AST`);
							path.traverse(assignment_visitor, {param});
							path.traverse(return_Visitor,{param});
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
							// AST, we wrap it in an invocation (actually calling the lambda function
							const function_path = `${this.output}aws/${name}`
							const info = fs.readFileSync(`${function_path}/info.txt`).toString().split("\n");
							for(var i = 0; i < info.length; i++) {
							   if(info[i] == 'endpoints:'){
								const endpoints = info[i + 1];
								var uri = endpoints.slice(9,endpoints.length);
								}
							}
							const local_root_path = path.findParent((path) => path.isProgram()); 
					 		local_root_path.traverse(object_visitor, {param});
							const decorated_local = decorateAsFnInvocation(path.node,uri,body);
							const ast = babylon.parse(decorated_local);
							path.replaceWith(ast);
							break;
						default:
							throw Error(`Unrecognized mode ${mode}. Valid options are ["extract", "prepare"]`);
					}


				}

            }
        },
		post(state) {

			const self = this;

			switch(self.mode) {
				case 'extract':
					if (!self.output) {
						// TODO Do additional checks here. Must exists or we can 
						// create it, must be RW, etc
						throw Error('Output folder is not defined');
					}
					const writeLambdas = () => {
						const names = _.keys(self.lambdas);
						console.log(`[Extract] - Found ${names.length} annotated functions`);
						_.forEach(names, (name) => {
							console.log(`[Extract] - Writing to ${self.output}/${name}.js}`);
							const function_path = `${self.output}aws/${name}`
							fx.mkdir(function_path, (err) => {
								if(err){
									console.log('error when generate the folder')
									throw err;
								}
							fs.writeFileSync(`${function_path}/${name}.js`, beautifier(self.lambdas[name]));
							const data = yaml.dump({ service: 'myService',
									  provider: { name: 'aws', runtime: 'nodejs4.3' },
									  functions: 
									   { name: 
									      { handler: name +'.' + name,
									        events: [ { http: { path: name, method: 'POST' } } ] } } })
							fs.writeFileSync(`${function_path}/serverless.yml`,data);
							});
		
						});
					};

					fs.stat(self.output, function (err, stats){
						if (err) { // Doesn't exist
							fx.mkdir(self.output, (err) => {
								if (err) {
									throw err;
								}
								writeLambdas();
							});
							return;
						}
						if (!stats.isDirectory()) {
							// This isn't a directory!
							callback(new Error(`${self.output} exists and is not a directory.`));
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