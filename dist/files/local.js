"use strict";

function display(l) {
    for (var i = 0; i < l.length; i++) {
        console.log(l[i]);
    }
}

/* @cloud */
"use strict";

function calcPrimes(obj) {
    var rp = require('request-promise');
    var options = {
        method: 'POST',
        uri: 'https://kzht7wr5vh.execute-api.us-east-1.amazonaws.com/dev/calcPrimes',
        body: {
            "obj": obj
        },
        json: true
    };
    return rp(options).then(function(response) {
        // console.log(response);
        return response;
    }).catch(function(error) {
        console.log(error);
        throw error;
    });
}

/* @cloud */
"use strict";

function addone(obj2) {
    var rp = require('request-promise');
    var options = {
        method: 'POST',
        uri: 'https://5m8ns11a63.execute-api.us-east-1.amazonaws.com/dev/addone',
        body: {
            "obj2": obj2
        },
        json: true
    };
    return rp(options).then(function(response) {
        // console.log(response);
        return response;
    }).catch(function(error) {
        console.log(error);
        throw error;
    });
}


var obj = {
    n: 200
};
var obj2 = {
    n: 100
};
var l = calcPrimes(obj).then(function(primes) {
    return display(primes);
});
var k = addone(obj2).then(function(numbers) {
    return display(numbers);
});