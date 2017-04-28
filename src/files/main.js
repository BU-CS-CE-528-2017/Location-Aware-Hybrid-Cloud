/* @cloud 
Provider:aws
S3:true
Region: us-east-2
*/
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
	var sum = 0;
	const avg = result.then((numbers) =>{
		for (var i =0 ; i < numbers.length; i++){
			sum = sum + numbers[i];
		}
		return sum/numbers.length;
	}
	return Promise.resolve(avg);
}

/* @cloud 
Provider: goog
Region: us-central1
Project: testgfc-164121
Credentions: /Users/reimari/.gcloud/testgfc-bcc6039af0aa.json
*/
function getRevenue(obj2){
	//Calculate Average
	var name = obj2.name;
	return Promise.resolve(`hello ${name}`);
}

var aws = {
	bucket: 'serverless-test-001',
	key: 'numbers.txt'
};

var express = require("express");
var app = express();
var router = express.Router();
var path = '/Users/reimari/Documents/bu/ec528/project' + '/view/'; //Change the file location as your local

router.use(function (req,res,next) {
	console.log("/" + req.method);
	next();
});

router.get("/",function(req,res){
	res.sendFile(path + "index.html");
});

router.get("/about",function(req,res){
	res.sendFile(path + "about.html");
});

router.get("/overview",function(req,res){
	res.sendFile(path + "diagram.html");
});

// var gg = {
//   bucket: 'ec528-demo',
//   key: 'Google-Rvenue.txt'
// };

var obj2 = {
	name: "Aaron"
};

app.post('/aws', function(req, res){
	getnumber(aws).then((result) => {
		console.log("Running on AWS, return: " + result);
		res.send("Running on AWS, returned: " + result);
	});
});

app.post('/goog', function(req,res){
	getRevenue(obj2).then((result) => {
		console.log("Running on GCS, returned" + result);
		res.send("Running on GCS, returned " + result);
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

app.use("/",router);

app.use("*",function(req,res){
	res.send("File not exist.");
});

app.listen(3000,function(){
	console.log("Live at Port 3000");
});
