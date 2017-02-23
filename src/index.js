//plugin

export default function({types: t}){
  return {
    visitor: {
      // visitor contents
      Program(path,file) {
        path.unshiftContainer('body', t.expressionStatement(t.stringLiteral('//Added at the top of the file')));
      }     
    }
  };
};
/**
module.exports = function(babel) {
    return {
        visitor: {
            FunctionDeclaration: function(path) {
                console.log(path.node.id.name)
                console.log(path.node.body.body[0].type)
            }
        }
    }
}
**/
