#!/usr/bin/env node

var express = require('express'),
	apitizer = require('../../index');

var app = express();

app.use(express.bodyParser());

var api = apitizer({ 
	namespace: 'apitizer.test.api', 
	path: '/api.js'
});

app.use(api.provider());

app.get('/', function(req, res){
	res.status(200).sendfile('test.html');
});

//--------------------------------------------------------------------------------

function biggerThan(a, b, call) {
	call.ok(a > b);
}

function bigObject(call) {
	var fs = require('fs');
	fs.stat('./', function(err, stats){
		call.ok(stats);
	});
}

function adminFunc(call) {
	if (!call.userinfo.isadmin) {
		call.fail('no priviliges');
	} else {
		call.ok();
	}
}

api.hook('call', function(cl){
	cl.userinfo = { 'isadmin': Math.random() > 0.5 };
	if (cl.name === 'bigObject') {
		cl.execute();
		return true;
	}
}).extend(require('./myapi'));

api.extend(biggerThan)
	.extend(bigObject)
	.extend(adminFunc);

api.extend({
	SOME_INT: 9001,
	SOME_FLOAT: 84.3418,
	A_TEXT: 'hello!',
	A_BOOL: true
});

//--------------------------------------------------------------------------------

app.listen(8080);

