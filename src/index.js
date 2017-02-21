// index.js
// calculates and displays prime numbers up to the desired value n
// accepts user inputted number, if none, uses 100
// use $ node index.js n

// @remote
function calcPrimes(n) {
    var sieve = [], i, j, primes = [];
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

function display(l) {
   for (i = 0; i < l.length; i++) {
   		console.log(l[i]);
   }
}


var n;

if(process.argv[2] > 0){
	n = process.argv[2];
}
else{
	n = 100;
}

const l = calcPrimes(n)
display(l);
