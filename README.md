# node-ssllabs

A node.js library for the [SSL Labs API][1].

> SSL Labs APIs expose the complete SSL/TLS server testing functionality in a programmatic fashion, allowing for scheduled and bulk assessment. We are making the APIs available to encourage site operators to regularly test their server configuration.

## Install

	npm install node-ssllabs

## Usage

	var ssllabs = require("node-ssllabs");
	
	ssllabs.scan("ssllabs.com", function (err, host) {
		console.dir(host);
	});

## Test Usage

Testing with [Mocha][5] and [Should.js][6].

	var ssllabs = require("node-ssllabs"),
		should = require("should");
	
	describe("ssllabs.com", function () {
		it("should get an A+", function (done) {
			ssllabs.scan("ssllabs.com", function (err, host) {
				if (err) {
					throw err;
				}
				host.endpoints.forEach(function (endpoint) {
					endpoint.grade.should.equal("A+");
				});
				done();
			});
		});
	});

## Advanced Usage

	var ssllabs = require("node-ssllabs");
	
	var options = {
		"host": "ssllabs.com",
		"fromCache": true,
		"maxAge": 24
	};
	
	ssllabs.scan(options, function (err, host) {
		console.dir(host);
	});
	
	ssllabs.info(function (err, info) {
		console.dir(info);
	});
	
	var options = {
		"host": "ssllabs.com",
		"publish": true,
		"startNew": true,
		"all": "done",
		"ignoreMismatch": true
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

## Todo

* add support for [access rate and rate limiting][4]
* add option to specify an array of hosts to scan
* have the `scan` function emit events for polling progress
* figure out if the maxAge parameter is required with the fromCache parameter

## Change Log

*develop branch — May 5, 2015*

* added test cases for tracking access rate and rate limiting
* updated analyze call to only start new assessments when current assessments is less than the max assessments

*0.4.3 — May 1, 2015*

* removed requirement that maxAge must be set if fromCache is set
* added check that fromCache is set if maxAge is set
* fixed bug where NaN was accepted for the maxAge parameter

*0.4.2 — April 27, 2015*

* added call to `info` before calling `analyze` in the `scan` function

*0.4.1 — April 27, 2015*

* refactored `scan` function to use `analyze` function for dryness
* improved test to ensure parallel scanning maintains context

*0.4.0 — April 23, 2015*

* added option to only specify a hostname for scanning
* added test for lost context in parallel scans
* added test if `startNew` and `fromCache` options are both true
* added additional parameter tests and verification

*0.3.0 — April 21, 2015*

* added `scan` function to encapsulate [protocol usage][3]

*0.2.0 — April 20, 2015*

* updated to work properly in other packages.

*0.1.0 — April 20, 2015*

* added support for the `getEndpointData` api endpoint.
* added support for the `getStatusCodes` api endpoint.
* improved error handling and reporting.

*0.0.1 — April 20, 2015*

* Initial version
* supports two api endpoints, `info` and `analyze`


  [1]: https://www.ssllabs.com/projects/ssllabs-apis/
  [2]: https://github.com/keithws/node-ssllabs/blob/master/LICENSE
  [3]: https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs.md#protocol-usage
  [4]: https://github.com/ssllabs/ssllabs-scan/blob/master/ssllabs-api-docs.md#access-rate-and-rate-limiting
  [5]: http://mochajs.org
  [6]: http://shouldjs.github.io
