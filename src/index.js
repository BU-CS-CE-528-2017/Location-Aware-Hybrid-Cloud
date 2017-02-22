module.exports = function(babel) {
    return {
        visitor: {
            Literal: function(path) {
                console.log(path.node.value)
            }
        }
    }
<<<<<<< HEAD
}
=======
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


>>>>>>> cf33bd74a96d48d596b4ea7559d988f268139072
