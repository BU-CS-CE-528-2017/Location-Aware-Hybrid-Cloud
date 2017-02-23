export default function({types: t}){
    return {
        visitor: {
            FunctionDeclaration(path) {
            	if(path.node.leadingComments){
            		if(path.node.leadingComments[0].value == "@cloud") {
                		console.log(path.node.id.name)
	                }
	                else {
	                	console.log(path.node.leadingComments[0].value)
	                	path.remove();
	                }
            	}
            	else{
            		console.log("no function annotation")
            	}
                
            }
        }
    }
}