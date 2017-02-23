"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (_ref) {
    var t = _ref.types;

    return {
        visitor: {
            FunctionDeclaration: function FunctionDeclaration(path) {
                if (path.node.leadingComments) {
                    if (path.node.leadingComments[0].value == "@cloud") {
                        console.log(path.node.id.name);
                    } else {
                        console.log(path.node.leadingComments[0].value);
                        path.remove();
                    }
                } else {
                    console.log("no function annotation");
                }
            }
        }
    };
};