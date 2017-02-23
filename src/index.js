//plugin

export default function({types: t}){
  return {
    visitor: {
      // visitor contents
      Program(path,file) {
	//path.insertBefore(t.expressionStatement(t.stringLiteral("This is the local version of the app")));	
	path.unshiftContainer('body', t.expressionStatement(t.stringLiteral('use helloworld')));
      }      
    }
  };
};
