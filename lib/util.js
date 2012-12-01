/*!
 * node-apitizer
 * Copyright (c) 2012 Volker Arweiler (volker.arweiler@gmail.com)
 * http://github.com/farwyler/node-apitizer
 * MIT Licensed
 */

exports.inspectFunc = function(){
	var r_args = /\(([\S\s]*?)\)/;
	var r_clear = /[ ,\t\r\n]+/;
	return function(fo){
		var arg = r_args.exec(fo)[1].trim();
		return {
			'func': fo,
			'name': fo.name,
			'args': arg.length ? arg.split(r_clear) : []
		};
	};
}();

exports.zip = function(a, b){
	var min = (a.length > b.length) ? b : a;
	var r = {};
	for (var i = 0; i < min.length; i += 1){
		r[a[i]] = b[i];
	}
	return r;
};

exports.objectValues = function(o){
	var r = [];
	for (var i in o) {
		r.push(o[i]);
	}
	return r;
};

exports.arrayRepr = function(a){
	var r = '[';
	if (a) {
		for (var i = 0; i < a.length; i += 1) {
			r += typeof(a[i]) === 'string' ? '\''+a[i]+'\'' : a[i].toString();
			if (i != a.length-1) {
				r += ', ';
			}
		}
	}
	r += ']';
	return r;
};

exports.renderTemplate = function(temp, params){
	var matches = temp.match(/\%\w+\%/g);
	var result = temp;
	if (matches) {
		for (var i = 0; i < matches.length; i += 1) {
			var wo = matches[i].slice(1, -1); 
			if (wo in params) {
				result = result.replace(matches[i], params[wo]);
			}
		}
	}
	return result;
};
