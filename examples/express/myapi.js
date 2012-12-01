/*
*/

var apitizer = require('../../index');

exports.APITIZER_VERSION = apitizer.version;

exports.echo = function(msg, call){
	call.ok(msg);
};

exports.repeatString = function(str, num, call){
	var r = '';
	for (var i = 0; i < num; i += 1) {
		r += str;
	}
	call.ok(r);
};

exports.pleaseFail = function(fail, call){
	if (fail) {
		call.fail('you said so');
	} else {
		call.ok('nope');
	}
};

exports.add = function(a, b, call){
	call.ok(a + b);
};
