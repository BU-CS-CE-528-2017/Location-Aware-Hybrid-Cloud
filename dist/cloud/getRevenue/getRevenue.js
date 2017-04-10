'use strict;'
module.exports.getRevenue = function(event, context, callback)


{
    var parsed_obj = JSON.parse(event.body);
    var obj = parsed_obj.obj;
    var AWS = require('aws-sdk'); // AWS dependencies
    var s3 = new AWS.S3();

    var bucket = obj.bucket;
    var key = obj.key;
    console.log("fetch from" + bucket);

    var nums = [];
    callback(null, {
        "statusCode": 200,
        "body": JSON.stringify(undefined)
    });

















}