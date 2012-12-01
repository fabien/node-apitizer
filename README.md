# Apitizer - quick and simple web api generator

Apitizer is a [node](http://nodejs.org) module for easily exposing server-side functions to the browser, thus allowing you to quickly construct simple _APIs_. It is designed to work in conjunction with [express](http://expressjs.com) but in theory can work with any _http_ server. After registering your functions with an API interface, a _javascript_ file is _automagically_ generated and served to the browser, exposing your functions in the specified namespace with their original signature. Transport is _JSON_ based, using either GET or POST XMLHttpRequests.

*Note:* The generated _javascript_ currently depends on [jQuery](http://www.jquery.com) being loaded!

## Minimal example using _express_

*Server*

```js
var express = require('express'),
	apitizer = require('apitizer');

var app = express();

app.use(express.bodyParser());

var api = apitizer({ 
	namespace: 'my.test.api', 
	path: '/myapi.js'
});

app.use(api.provider());

app.get('/', function(req, res){
	res.sendfile('test.html');
});

function myApiFunction(a, b, c, call) {
	call.ok({
		'add': a + b + c,
		'sub': a - b - c
	});
}

api.extend(myApiFunction).extend({ 'SOMEVALUE': 3832.1234 });

app.listen(8080);
```

*Browser*

```html
<DOCTYPE html>
<html lang="en">
	<head></head>
	<body>
		<script type="text/javascript" src="/jquery.min.js"></script>
		<script type="text/javascript" src="/myapi.js"></script>
		<script type="text/javascript">
			$(document).ready(function(){
				console.log(my.test.api.SOMEVALUE);
				my.test.api.myApiFunction(1, 2, 3, function(err, result){
					if (err) {
						alert(err);
					} else {
						console.log(result.add, result.sub);
					}
				});
			});
		</script>
	</body>
</html>
```

## Documentation


### Installation

via _npm_ (recommended)
	
	npm install apitizer --production

via _git_

	git clone https://github.com/farwyler/node-apitizer.git apitizer
	cd apitizer
	npm install --production

### Creating an interface
The _apitizer_ module is the constructor function for interface objects. You can have multiple of these but it is your responsibility to manage their _namespace_ and _path_ to avoid collisions.

#### apitizer(options)

Available options:

- `namespace` - The browser namespace your functions will be placed in. Nesting is possible via '.', e.g. 'my.cool.api' will be recursively created in the global namespace of your browser.
- `path` - The path at which your api will be served.
- `methd` - The _http_ request method to use, `'get'` or `'post'`. Defaults to `'post'`. *Note:* Using `'post'` requires you to add the `bodyParser` middleware to your _express_ app.
- `lint` - Boolean to enable _jshint_ pass on the generated _javascript_ code. Defaults to `true`.
- `uglify` - Boolean to enable _uglify_ and _minification_ pass on the generated _javascript_ code. Defaults to `true`.

*Example*

```js
var apitizer = require('apitizer');

var myapi = apitizer({
	namespace: 'my.test.api', 
	path: '/myapi.js'
});
```

### Extending the API

#### interface.extend(object)
Adds elements to the interface. Returns the interface object to allow chain calls, e.g. myapi.extend(func1).extend(func2).

- `object` - Accepts a single function or an object. Objects will be iterated through and all contained functions added to the interface.

*Example*

```js
function myApiFunction(a, b, c, call){
	//...
}

// make myApiFunction available to the browser
myapi.extend(myApiFunction);

// add some constants
myapi.extend({
	a_string: 'hello world!',
	a_number: 39383.98123,
	a_bool: false
});

// add a whole module
myapi.extend(require('./myapi.js'));
```

### Registering as _express_ middleware

#### interface.provider()
Registers your interface as a middleware to _express_.

**Important:** The default _http_ request method is POST, which requires you to add the `bodyParser` middleware to your _express_ app.

```js
expressapp.use(express.bodyParser()); // you dont need this if you are using GET requests

expressapp.use(myapi.provider());
```

### Functions and the CallObject
Functions exposed to the browser, have no limitation in argument count but always receive as last argument a _CallObject_. A _CallObject_ contains detailed contextual information about the call to be made and can be inspected/extended by registering a hook function. It also contains methods (`fail(...)` and `ok(...)`) to tell the interface that your function has finished and the response to send to the browser.

*Example*

```js
function myApiFunction(a, b, c, call){
	if (Math.random() < 0.5) {
		call.fail('so unlucky!');
	} else {
		call.ok({
			'add': a + b + c,
			'sub': a - b - c
		});
	}
}
```

*Calling the function from the browser*
```js
my.test.api.myApiFunction(23, 42, 966, function(err, result){
	if (err) {
		console.log(':(', err);
	} else {
		console.log(result.add, result.sub);
	}
}
```

**A CallObject is guaranteed to contain the following:**

#### CallObject.request
The original _connect/express_ request object.

#### CallObject.response
The original _connect/express_ response object.

#### CallObject.name
Name of the function to be called.

#### CallObjects.args
Function arguments received by the browser.

#### CallObject.fail(string)
Function to end the call unsuccessfully with a given message.

#### CallObject.ok(result)
Function to end the call successfully and return the result to the browser. *Note:* The result will be send as JSON.

#### CallObject.execute()
Performs the actual call to the interface function. 

**Important:** This method has to be called when using a `call` hook and nowhere else.

#### interface.hook(event, callback)

Available events:

- `'call'` - Called with the _CallObject_ before each call to an interface function. Can be used to extend the _CallObject_, e.g. with additional authentication information, if not already present in the _express_ request object. Can also prematurely end the call by calling `fail(...)` or `ok(...)`, in which case the actual function will not be executed. **Important:** If you register this hook, it will be your responsibility to trigger further processing of the call, by executing the `CallObject.execute()` after you are done.

*Example*

```js
myapi.hook('call', function(co){
	// do not allow calls to specific function
	if (co.name === 'badFunction') {
		co.fail('not allowed');
		return;
	}

	// add user authentication information to the CallObject
	co.userinfo = {
		name: 'John Doe',
		secret: 'Cats'
	};

	co.execute();
});

function myApiFunction(a, b, c, call){
	if (call.userinfo.secret === 'Cats') {
		call.ok();
	} else {
		call.fail('wrong!');
	}
}
```

### Miscellaneous

#### interface.render(cb)
Manually trigger the rendering of the client-side _javascript_ code and retrieve it as first argument to the provided callback function.

*Example*

```js
myapi.render(function(src){
	console.log(src);
});
```

## Support
- Pull requests are welcome
- Report issues [here](https://github.com/farwyler/node-apitizer/issues)
- Contact the [author](mailto:volker.arweiler+github@gmail.com)

## License
[MIT](http://github.com/farwyler/node-apitizer/blob/master/LICENSE)
