//plugin
/*
export default function({types: t}){
  return {
    visitor: {
      // visitor contents
      CommentBlock: function(path) {
                console.log(path.node.value)
      }    
    }
  };
};
*/
module.exports = function(babel) {
    return {
        visitor: {
            FunctionDeclaration: function(path) {
            	console.log(path.node.id.name)
                console.log(path.node.leadingComments[0].value)
            }
        }
    }
}

