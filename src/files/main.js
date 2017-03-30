/* @cloud */
function calcPrimes(obj) {
    var n = obj.n
    if(n > 0){
      // pass
    }
    else{
      n = 100;
    }
    var sieve = [], i, j, primes = [];
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

function display(l) {
   for (var i = 0; i < l.length; i++) {
      console.log(l[i]);
   }
}
<<<<<<< HEAD
const obj = {n : 200};
=======
>>>>>>> 29f3ed736358bf7e92f2665854a56dbcd7410378
const l = calcPrimes(obj).then((primes) => display(primes));
