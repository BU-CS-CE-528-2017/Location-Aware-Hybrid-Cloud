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
