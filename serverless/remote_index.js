'use strict';

module.exports.calcPrimes = (event, context, callback) => {
    var n = process.argv[2];
    if(n > 0){
      // pass
    }
    else{
      n = 100;
    }
    var sieve = [], i, j, primes = [];
    var res = "";
    for (i = 2; i <= n; ++i) {
        if (!sieve[i]) {
            // i has not been marked -- it is prime
            primes.push(i);
            res = res + i + ', ';
            for (j = i << 1; j <= n; j += i) {
                sieve[j] = true;
            }
        }
    }

    callback(null, res);
}