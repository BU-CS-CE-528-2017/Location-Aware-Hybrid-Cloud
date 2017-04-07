/* @cloud AWS */
function getRevenue(obj) {
  var AWS = require('aws-sdk'); // AWS dependencies
  var s3 = new AWS.S3();

  var bucket = obj.bucket;
  var key = obj.key;
  console.log("fetch from" +  bucket);

  var nums = []
  return new Promise(function(resolve, reject) {
    s3.getObject(
      { Bucket: bucket, Key: key },
      function (error, data) {
        console.log("fetching...");
        if (error != null) {
          console.log(error);
          reject(err);
          return;
        } else {
          let objectData = data.Body.toString('utf-8');
          var list = objectData.split('\n');
          for(var i = 0; i < list.length; i++){
            nums.push(parseFloat(list[i]));
          }
          resolve(nums);
        }
      });
  });
}

/* @cloud AWS */
function average(obj2){
  //Calculate Average
  var n = obj2.n
  var total = 0, arg = 0;
  for (var i = 0; i < n.length; i++){
    total += n[i];
  }
  arg = total / n.length;
  return Promise.resolve(arg);
}

const gg = {
  bucket : 'ec512-demo2',
  key : 'Google-Rvenue.txt'
};

//Express App
var express = require('express')
var app = express()

app.get('/avg', (req, res) => {
  getRevenue(gg).then((result) => {
    
    var obj2 = {n: result};
    average(obj2).then((avg) => {
      res.send("Fetched: " + result + 
        "<br> Average is: " + avg);
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
