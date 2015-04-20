# node-ssllabs

A node.js library for the [SSL Labs API][1].

## Install

	npm install node-ssllabs

## Usage

	var ssllabs = require("ssllabs");
	
	ssllabs.analyze({ "host": "ssllabs.com" }, function (err, host) {
		console.dir(host);
	});

## Requirements

underscore.js

## Dev Requirements

mocha.js
should.js

## Change Log

0.0.1 — April 20, 2015

* Initial version
* supports two api end-points, `info` and `analyze`


  [1]: https://www.ssllabs.com/projects/ssllabs-apis/