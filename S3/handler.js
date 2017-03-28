'use strict';

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

module.exports.fetch = (event, context, callback) => {
  s3.getObject(
    { Bucket: "ec512-demo2", Key: "Google-Rvenue.txt" },
    function (error, data) {
      if (error != null) {
        callback(null, "Failed to retrieve an object: " + error);
      } else {
        let objectData = data.Body.toString('utf-8');
        var list = objectData.split('\n');

        var nums = new Array();
        var i;
        for(i = 0; i < list.length; i++){
          nums.push(parseFloat(list[i]));
        }

        callback(null, nums);
        
      }
    }
  );

};