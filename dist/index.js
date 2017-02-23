'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;

  return {
    visitor: {
      // visitor contents
      Program: function Program(path, file) {
        path.unshiftContainer('body', t.expressionStatement(t.stringLiteral('//Added at the top of the file')));
      }
    }
  };
};

;
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
//plugin