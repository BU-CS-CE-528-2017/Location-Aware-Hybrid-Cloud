function readTextFile(file)
{
    var fs = require('fs'), filename = file;
	fs.readFile(filename, 'utf8', function(err, data) {
	  if (err) throw err;
	  data = data.substring(1, data.length - 4);

	  console.log('Display on local: ');
	  console.log(data)
	});
}

readTextFile(process.argv[2]);