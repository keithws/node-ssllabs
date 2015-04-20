# node-ssllabs

A node.js library for the [SSL Labs API][1].

> SSL Labs APIs expose the complete SSL/TLS server testing functionality in a programmatic fashion, allowing for scheduled and bulk assessment. We are making the APIs available to encourage site operators to regularly test their server configuration.

## Install

	npm install node-ssllabs

## Usage

	var ssllabs = require("ssllabs");
	
	ssllabs.info(function (err, info) {
		console.dir(info);
	});
	
	ssllabs.analyze({ "host": "ssllabs.com" }, function (err, host) {
		console.dir(host);
	});

## License

node-ssllabs is available under the [MIT License][2].

## Change Log

0.0.1 — April 20, 2015

* Initial version
* supports two api end-points, `info` and `analyze`


  [1]: https://www.ssllabs.com/projects/ssllabs-apis/
  [2]: https://github.com/keithws/node-ssllabs/blob/master/LICENSE
