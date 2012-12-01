/*!
 * node-apitizer
 * Copyright (c) 2012 Volker Arweiler (volker.arweiler@gmail.com)
 * http://github.com/farwyler/node-apitizer
 * MIT Licensed
 */

var uglify = require('uglify-js'),
	fs = require('fs'),
	path = require('path'),
	dot = require('dot'),
	util = require('./util'),
	jshint = require('jshint').JSHINT;

exports = module.exports = function(){
	function renderer(){ }

	var template = null;
	var dotopt = {};
	for (var i in dot.templateSettings) {
		dotopt[i] = dot.templateSettings[i];
	}
	dotopt.strip = false;
	
	fs.readFile(path.resolve(__dirname, '../templates/client.js.dot'), 'utf8', function(err, data){
		if (err) {
			throw Error('can\'t find client template');
		} else {
			template = dot.template(data, dotopt);
		}
	});

	renderer.render = function(opt, elems, finished){
		var src = template({ 
			namespace: opt.namespace,
			method: opt.method,
			elements: util.objectValues(elems),
			path: opt.path
		});

		if (opt.lint) {
			if (!jshint(src, { 'browser': true }, { 'console': false, '$': false })) {
				console.error(jshint.errors);
				throw Error('lint on client source failed');
			}
		}
		if (opt.uglify) {
			src = uglify.minify(src, { 'warnings': false, 'fromString': true }).code;
		}
		if (finished) {
			finished(src);
		}
	};
	return renderer;
};
