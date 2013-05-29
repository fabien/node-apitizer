/*!
 * node-apitizer
 * Copyright (c) 2012 Volker Arweiler (volker.arweiler@gmail.com)
 * http://github.com/farwyler/node-apitizer
 * MIT Licensed
 */

var util = require('./util'),
	render = require('./render');

exports = module.exports = function(opt){
	return new Interface(opt);
};

exports.version = require('../package').version;

function Call(fobj, fname, fargs, req, res) {
	var complete = false;
	var respond = function(stat, val){
		if (complete) {
			throw Error('call already already completed');
		}
		if (stat) {
			res.json({ 'ok': true, 'data': val });
		} else {
			res.json({ 'ok': false, 'error': val });
		}
		complete = true;
	};

	this.args = fargs;
	this.name = fname;
	this.request = req;
	this.response = res;
	this.fail = function(err){ respond(false, err); };
	this.ok = function(result){ respond(true, result); };
	this.execute = function(){
		if (complete) {
			throw Error('call already already completed');
		}
		this.args.push(this);
		return fobj.apply(null, this.args);
	};
}

function Interface(options) {
	if (!options) {
		throw Error('missing options argument');
	}
	options.namespace = options.namespace || 'apitizer';
	options.path = options.path || '/api.js';
	options.uglify = typeof(options.uglify) === 'boolean' ? options.uglify : true;
	options.lint = typeof(options.lint) === 'boolean' ? options.lint : false;
	options.cache = typeof(options.cache) === 'boolean' ? options.cache : true;
	options.method = (options.method === 'post' || options.method === 'get') ? options.method : 'post';

	var elements = { };
	var hooks = {
		'call': null
	};
	var source = '';
	var renderer = render();
	var dirty = function(){ source = ''; };

	var call = function(req, res){
		if (options.method === 'post') {
			if (!req.is('application/json')) {
				res.json({ 'ok': false, 'error': 'content type must be \'application/json\'' });
				return;
			}
		}
		var data = options.method === 'post' ? req.body : req.query;
		if (!data.hasOwnProperty('_call')) {
			res.json({ 'ok': false, 'error': 'missing \'_call\'' });
			return;
		}
		if (options.method === 'get') {
			data._args = JSON.parse(data._args);
		}
		var f = elements[data._call];
		if (!f || f.type !== 'function') {
			res.json({ 'ok': false, 'error': 'unknown function\'' + data._call + '\'' });
			return;
		}
		var args = [];
		for (var i in f.args) {
			var va = f.args[i];
			if (!data._args.hasOwnProperty(va)) {
				res.json({ 'ok': false, 'error': 'missing argument \'' + va + '\'' });
				return;
			}
			args.push(data._args[va]);
		}
		var c = new Call(f.func, f.name, args, req, res);
		if (!hooks.call || !hooks.call(c)) {
			c.execute();
		}
	};

	this.hook = function(hook, cb){
		hooks[hook] = cb;
		return this;
	};

	this.provider = function(){
		var me = this;
		return function(req, res, next){
			if (req.path === options.path) {
				if (options.method === 'post' && typeof(req.body) === 'undefined') {
					throw Error('missing request body! (use express.bodyParser)');
				}
				if ((options.method === 'post' && !Object.keys(req.body).length) || (options.method === 'get' && !Object.keys(req.query).length)) {
					res.set('Content-Type', 'text/javascript');
					if (!source) {
						renderer.render(options, elements, function(src){
							res.send(200, src);
							if (options.cache) {
								source = src;
							}
						});
					} else {
						res.send(200, source);
					}
				} else {
					call(req, res);
				}
			} else {
				next();
			}
		};
	};

	this.extend = function(elem){
		var type = typeof(elem);
		var add_func = function(f, n) {
			var info = util.inspectFunc(f);
			if (!info.args.length) {
				throw Error('api function "' + info.name + '" should have at least 1 argument (call object)');
			}
			info.name = n ? n : info.name;
			info.type = 'function';
			info.args = info.args.slice(0, -1); // strip context argument
			if (typeof(options.bind) === 'object') {
			    info.func = info.func.bind(options.bind);
			}
			elements[info.name] = info;
		};

		if (type === 'function') {
			add_func(elem);
		} else if (type === 'object') {
			for (var i in elem) {
				var it = typeof(elem[i]);
				if (it === 'function') {
					add_func(elem[i], i);
				} else if (it === 'number' || it === 'string' || it === 'boolean') {
					elements[i] = {
						'name': i,
						'type': it,
						'value': elem[i]
					};
				} else {
					throw Error('cannot extend by unsupported type, "' + type + '"');
				}
			}
		} else {
			throw Error('cannot extend by unsupported type, "' + type + '"');
		}
		dirty();
		return this;
	};

	this.render = function(cb){
		if (cb) {
			if (source) {
				cb(source);
			} else {
				renderer.render(options, elements, function(src){
					cb(src);
				});
			}
		}
		return this;
	};
}
