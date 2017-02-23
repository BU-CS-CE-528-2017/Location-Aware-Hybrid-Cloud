"use strict";

/*@cloud*/
function calcPrimes() {
    var n = process.argv[2];
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
    return primes;
}

/*@local*/
function display(l) {
    for (i = 0; i < l.length; i++) {
        console.log(l[i]);
    }
}

// sample1.js
// calculates and displays prime numbers up to the desired value n
// accepts user inputted number, if none, uses 100
// use $ node index.js n

// const l = calcPrimes()
// display(l);