"use strict";

function display(l) {
    for (var i = 0; i < l.length; i++) {
        console.log(l[i]);
    }
}

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

/* @cloud */
function addone(obj2) {
    var n = obj2.n;
    var numbers = [];
    for (var i = 1; i <= n; i++) {
        numbers.push(i);
    }
    return Promise.resolve(numbers);
}

var obj = { n: 200 };
var obj2 = { n: 100 };
var l = calcPrimes(obj).then(function (primes) {
    return display(primes);
});
var k = addone(obj2).then(function (numbers) {
    return display(numbers);
});