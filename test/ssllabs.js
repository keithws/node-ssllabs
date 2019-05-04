/* eslint-env node, mocha */
"use strict";

require("should");
var ssllabs = require("../lib/ssllabs.js");
var async = require("async");

describe("ssllabs", function () {

	describe("analyze()", function () {

		it("should throw an error if startNew and fromCache are both true", function (done) {
			var options = {
				host: "www.ssllabs.com",
				startNew: true,
				fromCache: true
			};
			ssllabs.analyze(options, function (err) {

				(function(){ throw err; }).should.throw(/startNew/);
				done(!err);

			});
		});

		it("should throw an error if maxAge is specified but fromCache is not", function (done) {

			var options = {
				host: "www.ssllabs.com",
				maxAge: 24
			};
			ssllabs.analyze(options, function (err) {

				(function(){ throw err; }).should.throw(/maxAge/);
				done(!err);

			});

		});

		it("should throw an error if maxAge is specified but fromCache is false", function (done) {

			var options = {
				host: "www.ssllabs.com",
				fromCache: false,
				maxAge: 24
			};
			ssllabs.analyze(options, function (err) {

				(function(){ throw err; }).should.throw(/maxAge/);
				done(!err);

			});

		});

		it("should throw an error if maxAge parameter is not a positive integer", function (done) {
			var options = {
				host: "www.ssllabs.com",
				fromCache: true,
				maxAge: NaN
			};
			ssllabs.analyze.bind(null, options).should.throw();
			options.maxAge = -1;
			ssllabs.analyze.bind(null, options).should.throw();
			options.maxAge = Infinity;
			ssllabs.analyze.bind(null, options).should.throw();
			options.maxAge = "x";
			ssllabs.analyze.bind(null, options).should.throw();
			options.maxAge = 1;
			ssllabs.verifyOptions.bind(null, options).should.not.throw();
			options.maxAge = 17532;
			ssllabs.verifyOptions.bind(null, options).should.not.throw();
			done();
		});

		it("should throw an error if all parameter is not on, off, or done", function (done) {
			var options = {
				host: "www.ssllabs.com",
				fromCache: true,
				maxAge: 24,
				all: "all"
			};
			ssllabs.analyze.bind(null, options).should.throw();
			done();
		});

	});

	describe("getEndpointData()", function () {

		it("should return an error if the host is not specified", function (done) {

			var options = {
				s: "127.0.0.1"
			};
			ssllabs.getEndpointData(options, function (err) {

				(function(){ throw err; }).should.throw("Host is required");
				done(!err);

			});

		});

		it("should return an error if the endpoint IP address is not specified", function (done) {

			var options = {
				host: "www.ssllabs.com",
			};
			ssllabs.getEndpointData(options, function (err) {

				(function(){ throw err; }).should.throw("Endpoint IP address is required");
				done(!err);

			});

		});

	});

	describe("getRootCertsRaw()", function () {

		it("should return an error if the trustStore is not a number", function (done) {

			var options = {
				trustStore: "a"
			};
			ssllabs.getRootCertsRaw(options, function (err) {

				(function(){ throw err; }).should.throw("trustStore parameter must be a number");
				done(!err);

			});

		});

		it("should return an error if the trustStore is not between 1 and 5, inclusive", function (done) {

			var options = {
				trustStore: 0
			};
			ssllabs.getRootCertsRaw(options, function (err) {

				(function(){ throw err; }).should.throw("trustStore parameter must be between 1 and 5, inclusive");
				done(!err);

			});

		});

	});

	describe("normalizeOptions()", function () {
		it("should accept string values and native values for options", function (done) {
			var options = {
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: "on",
				startNew: "on",
				fromCache: "on",
				maxAge: "24",
				all: "done",
				ignoreMismatch: "on"
			};
			ssllabs.normalizeOptions(options).should.eql({
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: true,
				startNew: true,
				fromCache: true,
				maxAge: 24,
				all: "done",
				ignoreMismatch: true
			});
			options = {
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: "off",
				startNew: "off",
				fromCache: "off",
				maxAge: "24",
				all: "done",
				ignoreMismatch: "off"
			};
			ssllabs.normalizeOptions(options).should.eql({
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: false,
				startNew: false,
				fromCache: false,
				maxAge: 24,
				all: "done",
				ignoreMismatch: false
			});
			options = {
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: "ON",
				startNew: "oN",
				fromCache: "Off",
				maxAge: "24",
				all: true,
				ignoreMismatch: "off"
			};
			ssllabs.normalizeOptions(options).should.eql({
				host: "www.ssllabs.com",
				s: "127.0.0.1",
				publish: true,
				startNew: true,
				fromCache: false,
				maxAge: 24,
				all: "on",
				ignoreMismatch: false
			});
			done();
		});
	});

	describe("library", function () {
		// because most of these tests wait for network responses
		this.timeout(16 * 1000);
		this.slow(4 * 1000);

		it("info() should check SSL Labs availability", function (done) {
			ssllabs.info(function (err, info) {
				if (err) {
					return done(err);
				}
				info.should.have.properties([
					"criteriaVersion",
					"currentAssessments",
					"engineVersion",
					"maxAssessments",
					"messages",
					"newAssessmentCoolOff"
				]);
				info.currentAssessments.should.be.a.Number;
				info.maxAssessments.should.be.a.Number;
				info.messages.should.be.an.Array;
				info.newAssessmentCoolOff.should.be.a.Number;
				done();
			});
		});

		it("should invoke assessment", function(done) {
			var options;

			options = {
				all: "done",
				host: "www.ssllabs.com",
				startNew: false
			};

			ssllabs.analyze(options, function (err, host) {
				if (err) {
					return done(err);
				}
				host.status.should.be.ok;
				done();
			});
		});

		it("should check progress", function(done) {
			var options;

			options = {
				all: "done",
				host: "www.ssllabs.com"
			};

			ssllabs.analyze(options, function (err, host) {
				if (err) {
					return done(err);
				}
				host.status.should.be.ok;
				done();
			});
		});

		it("should retrieve detailed endpoint information", function (done) {
			var options;

			options = {
				host: "www.ssllabs.com",
				s: "64.41.200.100"
			};

			ssllabs.getEndpointData(options, function (err, endpoint) {
				if (err) {
					done(err);
					return;
				}
				endpoint.statusMessage.should.be.ok;
				endpoint.ipAddress.should.equal("64.41.200.100");
				done();
			});
		});

		it("should retrieve known status codes", function (done) {
			ssllabs.getStatusCodes(function (err, statusCodes) {
				if (err) {
					return done(err);
				}
				statusCodes.should.have.property("statusDetails");
				done();
			});
		});

		it("should retrieve the (raw) root certificates used for trust validation", function (done) {
			ssllabs.getRootCertsRaw(function (err, rootCertsRaw) {
				if (err) {
					return done(err);
				}
				rootCertsRaw.should.be.ok;
				rootCertsRaw.should.be.a.String;
				done();
			});
		});

		it("should retrieve the (raw) root certificates (Windows) used for trust validation", function (done) {
			ssllabs.getRootCertsRaw({ trustStore: 5 }, function (err, rootCertsRaw) {
				if (err) {
					return done(err);
				}
				rootCertsRaw.should.be.ok;
				rootCertsRaw.should.be.a.String;
				rootCertsRaw.should.match(/Trust Store: Windows/);
				done();
			});
		});

		it("should retrieve the root certificates used for trust validation", function (done) {
			ssllabs.getRootCerts(function (err, certs) {
				if (err) {
					return done(err);
				}
				certs.should.be.ok;
				certs.should.be.an.Array;
				var firstCert = certs[0];
				firstCert.should.have.properties([
					"name",
					"subject",
					"keyType",
					"keyLength",
					"notBefore",
					"notAfter",
					"certificate"
				]);
				firstCert.keyType.should.be.a.String;
				firstCert.keyLength.should.be.a.Number;
				firstCert.notBefore.should.be.a.Date;
				firstCert.notAfter.should.be.a.Date;
				firstCert.certificate.should.be.a.String;
				done();
			});
		});

		it("should invoke analyze and poll until the assessment is finished (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			var options = {
				host: "facebook.com",
				startNew: true
			};

			ssllabs.scan(options, function (err, host) {
				if (err) {
					done(err);
					return;
				}
				host.status.should.be.ok;
				host.status.should.equal("READY");
				host.endpoints.length.should.be.above(0);
				host.endpoints.forEach(function (endpoint) {
					endpoint.grade.should.be.ok;
					endpoint.grade.should.not.be.empty;
				});
				done();
			});
		});

		it("should scan a host by just specifying the hostname", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			ssllabs.scan("apple.com", function (err, host) {
				if (err) {
					done(err);
					return;
				}
				host.status.should.be.ok;
				host.status.should.equal("READY");
				host.endpoints.length.should.be.above(0);
				host.endpoints.forEach(function (endpoint) {
					endpoint.grade.should.be.ok;
					endpoint.grade.should.not.be.empty;
				});
				done();
			});
		});

		it("should scan two hosts in parallel (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			async.parallel([
				function (callback) {
					ssllabs.scan({host: "amazon.com", startNew: true}, function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("amazon.com");
						callback(null, host);
					});
				},
				function (callback) {
					ssllabs.scan("google.com", function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("google.com");
						callback(null, host);
					});
				}
			], done);
		});

	});

});
