"use strict";

/* @cloud */
function calcPrimes(obj) {
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
    return Promise.resolve(primes);
}

function display(l) {
    for (i = 0; i < l.length; i++) {
        console.log(l[i]);
    }
}
var obj = { n: 200 };
var l = calcPrimes(obj).then(function (primes) {
    return display(primes);
});