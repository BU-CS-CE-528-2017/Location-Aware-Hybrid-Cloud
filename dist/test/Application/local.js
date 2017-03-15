var rp = require('request-promise');
var options = {
	method: 'GET',
	uri: 'https://909obvouza.execute-api.us-west-2.amazonaws.com/Trial'
}
rp(options).then(function (response) {
	display(response);
}).catch(function (error) {
	console.log(error);
});

function display(l) {
	for (i = 0; i < l.length; i++) {
		console.log(l[i]);
	}
}