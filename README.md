# node-ssllabs

A node.js library for the [SSL Labs API][1].

[![npm version](https://badge.fury.io/js/node-ssllabs.svg)](https://badge.fury.io/js/node-ssllabs)
[![dependencies](https://img.shields.io/david/keithws/node-ssllabs.svg)](https://david-dm.org/keithws/node-ssllabs)
[![dev dependencies](https://img.shields.io/david/dev/keithws/node-ssllabs.svg)](https://david-dm.org/keithws/node-ssllabs?type=dev)
[![Known Vulnerabilities](https://snyk.io/test/github/keithws/node-ssllabs/badge.svg)](https://snyk.io/test/github/keithws/node-ssllabs)
![npm downloads per month](https://img.shields.io/npm/dm/node-ssllabs.svg)
[![npm license](https://img.shields.io/npm/l/node-ssllabs.svg?color=blue)](https://github.com/keithws/node-ssllabs/blob/master/LICENSE)


> SSL Labs APIs expose the complete SSL/TLS server testing functionality in a programmatic fashion, allowing for scheduled and bulk assessment. We are making the APIs available to encourage site operators to regularly test their server configuration.

## Install

	npm install node-ssllabs

## Usage

	var ssllabs = require("node-ssllabs");
	
	ssllabs.scan("www.ssllabs.com", function (err, host) {
		console.dir(host);
	});

## Test Usage

Testing with [Mocha][5] and [Should.js][6].

	var ssllabs = require("node-ssllabs"),
		should = require("should");
	
	describe("www.ssllabs.com", function () {
		it("should get an A+", function (done) {
			ssllabs.scan("www.ssllabs.com", function (err, host) {
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
	
	ssllabs.scan({
		"host": "www.ssllabs.com",
		"fromCache": true,
		"maxAge": 24
	}, function (err, host) {
		console.dir(host);
	});
	
	ssllabs.info(function (err, info) {
		console.dir(info);
	});
	
	ssllabs.analyze({
		"host": "www.ssllabs.com",
		"publish": true,
		"startNew": true,
		"all": "done"
	}, function (err, host) {
		console.dir(host);
	});
	
	ssllabs.analyze({
		"host": "www.ssllabs.com",
		"fromCache": true,
		"maxAge": 72,
		"all": "on",
		"ignoreMismatch": true
	}, function (err, host) {
		console.dir(host);
	});
	
	ssllabs.getEndpointData({
		"host": "www.ssllabs.com",
		"s": "64.41.200.100",
		"fromCache": true
	}, function (err, endpointData) {
		console.dir(endpointData);
	});
	
	ssllabs.getStatusCodes(function (err, statusCodes) {
		console.dir(statusCodes);
	});
	
	ssllabs.getRootCertsRaw(function (err, rootCertsRaw) {
		console.dir(rootCertsRaw);
	});

	ssllabs.getRootCertsRaw({
		trustStore: 5
	}, function (err, rootCertsRaw) {
		console.dir(rootCertsRaw);
	});

	ssllabs.getRootCerts(function (err, rootCerts) {
		console.dir(rootCerts);
	});

	ssllabs.getRootCerts({
		trustStore: 5
	}, function (err, rootCerts) {
		console.dir(rootCerts);
	});


## License

node-ssllabs is available under the [MIT License][2].

## Todo

* add (more) support for [access rate and rate limiting][4]
* incorporate new info field, newAssessmentCoolOff, to access rate and rate limiting
* add option to specify an array of hosts to scan
* have the `scan` function emit events for polling progress
* figure out if the maxAge parameter is required with the fromCache parameter
* promise-ify and modernize
* add User Agent String to all requests
* make API version changeable (maybe?) with createClient()?
* minimize dependencies
* add support for HTTP proxy settings

## Change Log

*0.6.0— May 2, 2019*

* updated API endpoint from v2 to v3
* updated dependencies
* switched from JSHint to eslint for syntax checking
* fixed typos
* added basic support for access rate and rate limiting to `scan()`
* added support for the `trustStore` parameter to the `getRootCertsRaw()` call
* added `getRootCerts()` call that returns the data as a plain-old object

*0.5.0 — July 14, 2016*

* added support for new API call, `getRootCertsRaw`
* improved testing with Mocha
* improved `normalizeOptions` function
* updated documentation

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
