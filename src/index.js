module.exports = function(babel) {
    return {
        visitor: {
            FunctionDeclaration: function(path) {
                console.log(path.node.id.name)
            }
        }
    }
}
