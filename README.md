lbac-js
=======

A JavaScript port of **Let's Build a Compiler** (lbac) by Jack Crenshaw. *A a non-technical introduction to compiler construction*.

Please refer to the [original context](http://compilers.iecc.com/crenshaw/) or alternatively a [LaTeX typeset PDF version](http://www.stack.nl/~marcov/compiler.pdf). 

Demo
--------
The code is constructed section by section based on prototypal inheritance. It aims to be as similar to the original Pascal version as possible. A tiny console provids I/O routines and basic user interactions. [Check out the demo](http://malcomwu.github.com/lbac-js/).

Build
--------
The lbac-js project structures and workflow were initialized using [Yeoman](http://yeoman.io/).
Building lbac-js requires [node.js](http://nodejs.org/)
and [Ruby](http://www.ruby-lang.org/en/downloads/) (for [Compass](http://compass-style.org/)) pre-installed.

Install grunt-cli and bower globally

    npm install -g grunt-cli bower

Install the Compass gem

    gem install compass

Clone the lbac-js repository
```bash
git clone git://github.com/malcomwu/lbac-js.git
cd lbac-js
```

Install node modules defined in `package.json` locally to `node_modules/`

    npm install

Install components defined in `components.json` to `app/componets/`

    bower install

Preview the web, test and build

    grunt server
    grunt test
    grunt build