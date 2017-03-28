'use strict';

module.exports.fetch = (event, context, callback) => {
  var AWS = require('aws-sdk'); // AWS dependencies
  var s3 = new AWS.S3();

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
//Draft function need to pass parameter via request promise
module.exports.calculate = (event. context, callback) => {
  var list = event.nums;  //list from fetch
  var arg = 0, total = 0, i;
  for(i = 0; i < list.length; i++){
    total += list[i];
  }
  arg = total / list.length;
  callback(null, arg);
};
