'use strict';

exports.http = (request, response) => {
  console.log('Hello from "http"');
  response.status(200).send('Hello World!');
};


exports.event = (event, callback) => {
    // var parsed_obj = JSON.parse(event.body);
    // var obj = parsed_obj.obj;
    var obj = event.obj;
    var n = obj.n;
    if (n > 0) {
        // pass
    } else {
        n = 100;
    }
    var sieve = [],
        i,
        j,
        primes = [];
    for (i = 2; i <= n; ++i) {
        if (!sieve[i]) {
            // i has not been marked -- it is prime
            primes.push(i);
            for (j = i << 1; j <= n; j += i) {
                sieve[j] = true;
            }
        }
    }
    // callback(null, {
    //     "statusCode": 200,
    //     "body": JSON.stringify(primes)
    // });
    callback(null,primes);

}