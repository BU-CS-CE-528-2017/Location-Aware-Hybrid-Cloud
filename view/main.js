/* @cloud aws */
function getnumber(obj) {
	var AWS = require('aws-sdk'); // AWS dependencies
	var s3 = new AWS.S3();

	var bucket = obj.bucket;
	var key = obj.key;
	console.log('fetch from' + bucket);

	var nums = [];

	s3.getObject({ Bucket: bucket, Key: key }, function (error, data) {
		console.log('fetching...');
		if (error != null) {
		console.log(error);
		reject(err);
		} else {
		var objectData = data.Body.toString('utf-8');
		var list = objectData.split('\n');
		for (var i = 0; i < list.length; i++) {
			nums.push(parseFloat(list[i]));
		}
		console.log('fetched: ' + nums);
		}
	});
	
	return Promise.resolve(nums);
}

/* @cloud goog */
function getRevenue(obj) {
	var rp = require('request-promise');
	var options = {
		method: 'GET',
		uri: 'https://www.googleapis.com/storage/v1/b/ec528-demo',
		qs: {
			"obj": obj
		},
		json: true
	};
	return rp(options).then(function(response) {
		// console.log(response);
		return response;
	}).catch(function(error) {
		console.log(error);
		throw error;
	});
}

var express = require("express");
var app = express();
var router = express.Router();
var path = '/Users/star/EC528/Location-Aware-Hybrid-Cloud' + '/views/';

router.use(function (req, res, next) {
	console.log("/" + req.method);
	next();
});

router.get("/",function(req, res){
	res.sendFile(path + "index.html");
});

router.get("/about",function(req, res){
	res.sendFile(path + "about.html");
});

router.get("/overview",function(req, res){
	res.sendFile(path + "diagram.html");
});

var aws = {
	bucket : 'ec512-demo2',
	key : 'Google-Rvenue.txt'
};

var gg = {
	bucket: 'ec528-demo',
	key: 'Google-Rvenue.txt'
};

app.post('/aws', function(req, res){
	console.log("Running AWS");
	getnumber(aws).then((result) => {
	var total = 0;
	for(var i=0; i<result.length; i++){
		total = total + result[i];
	}
	total = total / result.length;
	console.log("Running on AWS, the average is: " + total);
	res.send("Running on AWS, Fetched: " + result + "<br> The average is: " + total);
	});
});

app.post('/goog', function(req, res){
	console.log("Running GCF");
	getRevenue(gg).then((result) => {
		var total = 0;
		for(var i = 0; i < result.length; i++){
			total = total + result[i];
		}
		total = total / result.length;
		console.log("Running on GCS, the average is: " + total);
		res.send("Running on GCS, Fetched: " + result + "<br> The average is: " + total);
	});
});

app.use(express.static('public'));

app.post('/test', function (req, res) {
	console.log('works');
});

var server = app.listen(8081, function () {
	var host = server.address().address
	var port = server.address().port
	console.log("Example app listening at http://%s:%s", host, port)
})

app.use("/", router);

app.use("*", function(req,res) {
	res.send("File not exist.");
});

app.listen(3000,function(){
	console.log("Live at Port 3000");
});
