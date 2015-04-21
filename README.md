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
	
	var options = {
		"host": "ssllabs.com"
	};
	ssllabs.analyze(options, function (err, host) {
		console.dir(host);
	});
	
	var options = {
		"host": "ssllabs.com",
		"s": "64.41.200.100"
	};
	ssllabs.getEndpointData(options, function (err, endpointData) {
		console.dir(endpointData);
	});
	
	ssllabs.getStatusCodes(function (err, statusCodes) {
		console.dir(statusCodes);
	});

## License

node-ssllabs is available under the [MIT License][2].

## Change Log

**0.1.0 — April 20, 2015**

* added support for the `getEndpointData` api endpoint.
* added support for the `getStatusCodes` api endpoint.
* improved error reporting.
* improved code quality.

**0.0.1 — April 20, 2015**

* Initial version
* supports two api endpoints, `info` and `analyze`


  [1]: https://www.ssllabs.com/projects/ssllabs-apis/
  [2]: https://github.com/keithws/node-ssllabs/blob/master/LICENSE
