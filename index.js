var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var uuid = require('node-uuid');
var express = require('express');

var imageDB = {};
var UUID_cache = {};
var app = express();

readImages();

//app.param('size', /^\d+$/);

app.get('/captcha/:UUID/:type', function(req, res){
	var UUID = req.params.UUID;
	var type = req.params.type;
	var body = "false";

	if(UUID_cache[UUID] == type) {
		body = "true";

		delete UUID_cache[UUID];
	}

	res.setHeader('Content-Type', 'text/json');
	res.setHeader('Content-Length', Buffer.byteLength(body));
	res.end(body);
});

app.get('/captcha/:size', function(req, res){
	var body = JSON.stringify(pickCaptchaSet(req.params.size));
	res.setHeader('Content-Type', 'text/json');
	res.setHeader('Content-Length', Buffer.byteLength(body));
	res.end(body);
});

//app.use(express.methodOverride());
app.use(express.static(__dirname + path.sep + 'www'));
app.listen(3000);

console.log('Listening on port 3000');

function readImages() {
	fs.readdirSync('img').forEach(function(category) {
		imageDB[category] = [];
		fs.readdirSync('img' + path.sep + category).forEach(function(image) {
			var data = fs.readFileSync('img' + path.sep + category + path.sep + image);
			imageDB[category].push("data:image/" + image.substr(-3) + ";base64," + new Buffer(data).toString('base64'));
		});
	});
}

function pickCaptchaSet(size) {
	var categories  = _.keys(imageDB);

	var type = categories[_.random(categories.length - 1)];
	var image = imageDB[type][_.random(imageDB[type].length - 1)];
	var UUID = uuid.v4();

	UUID_cache[UUID] = type;

	var captchaSet = {
		answer: type,
		list: []
	};

	captchaSet.list.push({
		UUID: UUID,
		image: image
	});

	while(size > 1) {
		type = categories[_.random(categories.length - 1)];
		if(type == captchaSet.answer) {
			continue;
		}

		image = imageDB[type][_.random(imageDB[type].length - 1)];
		
		captchaSet.list.push({
			UUID: uuid.v4(),
			image: image
		});

		size--;
	}

	return captchaSet;
}