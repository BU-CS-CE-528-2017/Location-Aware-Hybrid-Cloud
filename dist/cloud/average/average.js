'use strict;'
module.exports.average = function(event, context, callback)































{
    var parsed_obj2 = JSON.parse(event.body);
    var obj2 = parsed_obj2.obj2;
    //Calculate Average
    var n = obj2.n;
    var total = 0,
        arg = 0;
    for (var i = 0; i < n.length; i++) {
        total += n[i];
    }
    arg = total / n.length;
    callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(arg)
    });

}