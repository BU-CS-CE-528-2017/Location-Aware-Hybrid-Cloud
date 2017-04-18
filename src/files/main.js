/* @cloud aws */
function numlist(obj2) {
    var n = obj2.n;
    var numbers = [];
    for (var i = 1; i <= n; i++) {
        numbers.push(i);
    }
    return Promise.resolve(numbers);
}

/* @cloud goog */
function getRevenue(obj) {
    var n = 200;
    if (n > 0) {
        // pass
    } else {
        n = 100;
    }
    var sieve = [],
        i,
        j,
        primes = [];
    for (var i = 2; i <= n; ++i) {
        if (!sieve[i]) {
            // i has not been marked -- it is prime
            primes.push(i);
            for (j = i << 1; j <= n; j += i) {
                sieve[j] = true;
            }
        }
    }
    return Promise.resolve(primes);
}

var express = require("express");
var app = express();
var router = express.Router();
var path = 'change the file locations' + '/view/'; //Change the file location as your local

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

var aws = {
  bucket : 'ec512-demo2',
  key : 'Google-Rvenue.txt'
};

var gg = {
  bucket: 'ec528-demo',
  key: 'Google-Rvenue.txt'
};

app.post('/aws', function(req, res){
  getnumber(aws).then((result) => {
    console.log("Running on AWS, return: " + total);
    res.send("Running on AWS, returned: " + total);
  });
});

app.post('/goog', function(req,res){
  getRevenue(gg).then((result) => {
    console.log("Running on GCS, prime numbers are: " + total);
    res.send("Running on GCS prime numbers are: " + total);
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
