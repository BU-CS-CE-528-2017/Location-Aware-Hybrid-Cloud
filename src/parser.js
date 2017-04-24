const _ = require("lodash");
const beautifier = require("js-beautify").js;
const fs = require("fs");
const generate = require("babel-generator");
const fx = require("mkdir-recursive");
const yaml = require("js-yaml");
const bluebird = require("bluebird");
const babylon = require("babylon");

const body = "";

const mkdir = bluebird.promisify(fx.mkdir);
module.exports = function({ types: t }) {

  const GetCloudService = node => {
    const parameters = {};
    const comments = _.map(node.leadingComments, comment => comment.value);
    if(comments.length > 0){
    var commentslist = comments[0].split('\n');
    if (_.some(comments, comment => comment.match(/@cloud/))) {
        commentslist.forEach((line)=>{
        const wordlist = line.split(':');
        if(wordlist.length >= 2){
          const word_key = wordlist[0].trim();
          const word_value = wordlist[1].trim();
          parameters[word_key.toLowerCase()] = word_value;
      }
    })
      return parameters;
  }else{
    return null;
  }
  }else{
    return null;
  }
};

  // Takes a node from the AST and converts it to
  // its string representation
  const astToSourceString = node => {
    const options = {
      retainLines: true
    };
    const source = generate.default(node, options);
    return source.code;
  };

  // Wraps a node as an AWS lambda function
  const decorateAsLambda = node => {
    const fnArgs = _.map(node.params, param => param.name);

    _.forEach(fnArgs, arg => {
      const parseObj = t.variableDeclarator(
        t.identifier(`parsed_${arg}`),
        t.identifier("JSON.parse(event.body)")
      );
      const actualVar = t.variableDeclarator(
        t.identifier(arg),
        t.identifier(`parsed_${arg}.${arg}`)
      );
      const declaration_obj = t.variableDeclaration("var", [parseObj]);
      const declaration = t.variableDeclaration("var", [actualVar]);
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

  const decorateAsGcf = node => {
      const fnArgs = _.map(node.params, param => param.name);

      _.forEach(fnArgs, arg => {
      const parseObj = t.variableDeclarator(
        t.identifier(`parsed_${arg}`),
        t.identifier("request.body")
      );
      const actualVar = t.variableDeclarator(
        t.identifier(arg),
        t.identifier(`parsed_${arg}.${arg}`)
      );
      const declaration_obj = t.variableDeclaration("var", [parseObj]);
      const declaration = t.variableDeclaration("var", [actualVar]);
      node.body.body.unshift(declaration);
      node.body.body.unshift(declaration_obj);
      // const actualVar = t.variableDeclarator(t.identifier(arg), t.identifier(`event.${arg}`));
      // const declaration = t.variableDeclaration('var', [actualVar]);
    });
    const functionName = node.id.name;
    const gfs = `
      'use strict;'
      module.exports.${functionName} = function(request,response)${astToSourceString(node.body)}
    `;
    return gfs;
  };

  const decorateAsFnInvocation = (node, uri) => {
    const fnArgs = _.map(node.params, param => param.name);
    const body = `{ ${_.map(fnArgs, arg => `"${arg}": ${arg}`).join(",")} }`;
    const decorated = `
    function ${node.id.name}(${fnArgs.join(",")}) {
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

  const decorateAsGoogInvocation = (node,platform) => {
    const project_name = platform['project'];
    const Credentions_path = platform['credentions']
    var Region_name = 'us-central1';
    if('region' in platform){
      Region_name = platform['region'];
    }
    const uri = `https://${Region_name}-${project_name}.cloudfunctions.net/${node.id.name}`;
    const fnArgs = _.map(node.params, param => param.name);
    const body = `{ ${_.map(fnArgs, arg => `"${arg}": ${arg}`).join(",")} }`;
    const decorated = `
    function ${node.id.name}(${fnArgs.join(",")}){
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

  const createServerlessDeployment = (name,platform) => {
    var Region_name = 'us-east-1';
    if('region' in platform){
      Region_name = platform['region'];
    }
    const data = yaml.dump({
      service: `my${name}`,
      provider: { name: "aws", runtime: "nodejs4.3", region:`${Region_name}`},
      functions: {
        name: {
          handler: `${name}.${name}`,
          events: [{ http: { path: name, method: "POST" } }]
        }
      }
    });
    return data;
  };

  const createServerlessgoogDeployment = (name, platform) => {
    const project_name = platform['project'];
    const Credentions_path = platform['Credentions']
    var Region_name = 'us-central1';
    if('region' in platform){
      Region_name = platform['region'];
    }
    const data = yaml.dump({
      service: "testgcf",
      provider: {
        name: "google",
        runtime: "nodejs",
        project: `${project_name}`,
        credentials: `${Credentions_path}`
      },
      plugins: ["serverless-google-cloudfunctions"],
      functions: { name: { handler: `${name}`, events: [{ http: "path" }] } }
    });
    return data;
  };

  // visitor used to replace the returned reqeust to callback function.
  const return_visitor = {
    ReturnStatement(path) {
      const return_type = path.node.argument.type;
      if(return_type == "CallExpression"){
        if(this.platform['s3'] != 'true'){
          const backvalue = path.node.argument.arguments[0];
          const value = astToSourceString(backvalue);
          path.replaceWithSourceString(
          `callback(null,{"statusCode": 200,"body":JSON.stringify(${value})})`);
        }else{
          const backvalue = path.node.argument.arguments[0];
          const value = astToSourceString(backvalue);
          path.replaceWithSourceString(
          `${value}.then((ans) =>{
            callback(null,{"statusCode": 200,"body":JSON.stringify(ans)})
          })`);
        }
    }
    }
  };

  const goog_return_visitor = {
    ReturnStatement(path) {
      const return_type = path.node.argument.type;
      if(return_type == "CallExpression"){
          const backvalue = path.node.argument.arguments[0];
          const value = astToSourceString(backvalue);
          path.replaceWithSourceString(`response.status(200).send(${value})`);
      }
    }
  };

  return {
    pre(state) {
      // Holds the content of the functions annotated with @cloud
      this.lambdas = {};
      this.goog = {};
      this.mode = "";
      this.output = "";
      this.uris = {};
      this.platform = {};
      this.name = "";
    },

    visitor: {
      FunctionDeclaration(path, state) {
        const name = path.node.id.name;
        this.platform[name] = GetCloudService(path.node);
        if (this.platform[name]) {
          this.mode = state.opts.mode;
          this.output = state.opts.output;
          this.uris = state.opts.uris;
          this.name = name;
          const platform = this.platform[name];
          switch (this.mode) {
            case "extract":
              if (platform['provider'] == "aws") {
                console.log(
                  `[Extract] - Function "${name}" is annotated with @cloud aws. Removing from AST`
                );
                path.traverse(return_visitor,{platform});
                const decorated = decorateAsLambda(path.node);
                if (this.lambdas[name]) {
                  // TODO We should probably include the filename in the name, that
                  // way we eliminate the chances of having duplicate functions.
                  throw Error(`Duplication function ${name}`);
                }
                this.lambdas[name] = decorated;
                path.remove();
              } else if (platform['provider'] == "goog") {
                console.log(
                  `[Extract] - Function "${name}" is annotated with @cloud goog. Removing from AST`
                );
                path.traverse(goog_return_visitor);
                const decorated = decorateAsGcf(path.node);
                if (this.goog[name]) {
                  // TODO We should probably include the filename in the name, that
                  // way we eliminate the chances of having duplicate functions.
                  throw Error(`Duplication function ${name}`);
                }
                this.goog[name] = decorated;
                path.remove();
              }
              break;
            case "prepare":
              if (platform['provider'] == "aws") {
                console.log(
                  `[Prepare] - Function "${name}" is annotated with @cloud aws. Replacing implementation by function invocation`
                );
                const decoratedLocal = decorateAsFnInvocation(
                  path.node,
                  this.uris[name]
                );
                const ast = babylon.parse(decoratedLocal);
                path.replaceWith(ast);
              } else if (platform['provider'] == "goog") {
                console.log(
                  `[Prepare] - Function "${name}" is annotated with @cloud google. Replacing implementation by function invocation`
                );
                const decoratedLocal = decorateAsGoogInvocation(path.node, platform);
                const ast = babylon.parse(decoratedLocal);
                path.replaceWith(ast);
              }

              break;

            default: {
              throw Error(
                `Unrecognized mode ${mode}. Valid options are ["extract", "prepare"]`
              );
            }
          }
        }
      }
    },
    post(state) {
      const self = this;
      const platform = self.platform;
      switch (self.mode) {
        case "extract": {
          if (!self.output) {
            // TODO Do additional checks here. Must exists or we can
            // create it, must be RW, etc
            throw Error("Output folder is not defined");
          }
          const writeLambdas = () => {
            const names = _.keys(self.lambdas);
            console.log(
              `[Extract] - Found ${names.length} annotated functions`
            );
            _.forEach(names, name => {
              const functionPath = `${self.output}/${name}`;
              mkdir(functionPath)
                .then(() => {
                  console.log(
                    `[Extract] - Writing content and deployment info to ${functionPath}`
                  );
                  fs.writeFileSync(
                    `${functionPath}/${name}.js`,
                    beautifier(self.lambdas[name])
                  );
                  fs.writeFileSync(
                    `${functionPath}/serverless.yml`,
                    createServerlessDeployment(name,platform[name])
                  );
                })
                .catch(err => {
                  console.log(err);
                });
            });
          };

          const writegoog = () => {
            const names = _.keys(self.goog);
            console.log(
              `[Extract] - Found ${names.length} annotated functions`
            );
            _.forEach(names, name => {
              const functionPath = `${self.output}/${name}`;
              mkdir(functionPath)
                .then(() => {
                  console.log(
                    `[Extract] - Writing content and deployment info to ${functionPath}`
                  );
                  fs.writeFileSync(
                    `${functionPath}/index.js`,
                    beautifier(self.goog[name])
                  );
                  fs.writeFileSync(
                    `${functionPath}/serverless.yml`,
                    createServerlessgoogDeployment(name,platform[name])
                  );
                })
                .catch(err => {
                  console.log(err);
                });
            });
          };
          const mkdir_promise = mkdir(`${self.output}`);
          mkdir_promise.then(() => writeLambdas());
          mkdir_promise.then(() => writegoog());
          break;
        }
        case "prepare": {
          // No-op, at least so far
          break;
        }
        default: {
          if (_.keys(self.lambdas).length > 0) {
            throw Error(
              `Unrecognized mode [${self.mode}]. Valid options are ["extract", "prepare"]`
            );
          }
        }
      }
    }
  };
};
