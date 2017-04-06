'use strict;'
module.exports.addone = function(event, context, callback)
































{
    var parsed_obj2 = JSON.parse(event.body);
    var obj2 = parsed_obj2.obj2;
    var n = obj2.n;
    var numbers = [];
    for (var i = 1; i <= n; i++) {
        numbers.push(i);
    }
    callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(numbers)
    });

}