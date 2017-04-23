
/* @cloud aws */
function getnumber(obj) {
	var AWS = require('aws-sdk'); // AWS dependencies
	var s3 = new AWS.S3();

	var bucket = obj.bucket;
	var key = obj.key;
	console.log('fetch from' +  bucket);
  var nums = []

 var result = new Promise ((resolve,reject) => {
    s3.getObject({ Bucket: bucket, Key: key }, function (error, data) {
      console.log("fetching...");
      if (error != null) {
        console.log(error);
        reject(err);
      } else {
        var objectData = data.Body.toString('utf-8');
        var list = objectData.split('\n');
        for (var i = 0; i < list.length; i++) {
          nums.push(parseFloat(list[i]));
        }
        resolve(nums);
      }
    });
  });

	return Promise.resolve(result.then(() =>{
 	return nums;
 }));
}

/* @cloud goog */
function calcaverage(obj2){
	//Calculate Average
	var n = obj2.n;
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

var test = {
	bucket: 'serverless-test-001',
	key: 'numbers.txt'
};
//Express App
var express = require('express');
var app = express();

app.get('/avg', (req, res) => {
	getnumber(test).then((result) => {
		var obj2 = {n: result};
		calcaverage(obj2).then((avg) => {
			res.send('Fetched: ' + result + '<br> Average is: ' + avg);
		});
	});
});

app.get('/aws',(req, res) => {
  getnumber(test).then((result) => {
    console.log(result);

  })
});

app.listen(8080, function () {
	console.log('Example app listening on port 8080!');
});