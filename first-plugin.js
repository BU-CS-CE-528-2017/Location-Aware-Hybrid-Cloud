module.exports = function(babel) {
    return {
        visitor: {
            Literal: function(path) {
                console.log(path.node.value)
            }
        }
    }
}