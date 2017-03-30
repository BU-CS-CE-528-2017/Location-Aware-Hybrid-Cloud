function display(l) {
   for (var i = 0; i < l.length; i++) {
      console.log(l[i]);
   }
}

/* @cloud */
function calRevenue(obj) {
  var AWS = require('aws-sdk'); // AWS dependencies
  var s3 = new AWS.S3();

  var bucket = obj.bucket;
  var key = obj.key;
  console.log("fetch from" +  bucket);
  var goog = [ 0.4, 1.5, 3.2, 6.1, 10.6, 16.6, 21.8, 23.7, 29.3, 37.9, 50.18, 55.51, 65.67, 74.54, 89.46 ];
  var nums = []
  s3.getObject(
    { Bucket: bucket, Key: key },
    function (error, data) {
      console.log("fetching...");
      if (error != null) {
        console.log(error);
      } else {
        let objectData = data.Body.toString('utf-8');
        var list = objectData.split('\n');
        for(var i = 0; i < list.length; i++){
          nums.push(parseFloat(list[i]));
        }
        console.log(nums);
      }
    }
  );

  return Promise.resolve(goog);
}

/* @cloud */
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


const l = calRevenue(gg).then((primes) => {
  console.log("Fetched: " + primes);
  var obj2 = {n: primes};
  const k = average(obj2).then((numbers) => {
    console.log("arg is " + numbers);
  });
});


