//plugin

export default function({types: t}){
  return {
    visitor: {
      // visitor contents
      Program(path,file) {
        path.unshiftContainer('body', t.expressionStatement(t.stringLiteral('Added at the top of the file')));
      }     
    }
  };
};
