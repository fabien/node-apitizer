JSHINT = node_modules/.bin/jshint
JSHINT_FLAGS = --config jshint.cfg

JS_SRC = $(shell find lib/*js *.js examples/express/*.js)
JS_HINT = $(JS_SRC:.js=.js.hint)

all: $(JS_HINT)

%.js.hint: %.js
	$(JSHINT) $(JSHINT_FLAGS) $<
