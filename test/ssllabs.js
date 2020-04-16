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
				startNew: "On",
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
				try {
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
				} catch (err) {
					console.log(info);
					done(err);
				}
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
				try {
					host.status.should.be.ok;
					done();
				} catch (err) {
					console.log(host);
					done(err);
				}
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
				try {
					host.status.should.be.ok;
					done();
				} catch (err) {
					console.log(host);
					done(err);
				}
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
				try {
					endpoint.statusMessage.should.be.ok;
					endpoint.ipAddress.should.equal("64.41.200.100");
					done();
				} catch (err) {
					console.log(endpoint);
					done(err);
				}
			});
		});

		it("should retrieve known status codes", function (done) {
			ssllabs.getStatusCodes(function (err, statusCodes) {
				if (err) {
					return done(err);
				}
				try {
					statusCodes.should.have.property("statusDetails");
					done();
				} catch (err) {
					console.log(statusCodes);
					done(err);
				}
			});
		});

		it("should retrieve the (raw) root certificates used for trust validation", function (done) {
			ssllabs.getRootCertsRaw(function (err, rootCertsRaw) {
				if (err) {
					return done(err);
				}
				try {
					rootCertsRaw.should.be.ok;
					rootCertsRaw.should.be.a.String;
					done();
				} catch (err) {
					console.log(rootCertsRaw);
					done(err);
				}
			});
		});

		it("should retrieve the (raw) root certificates (Windows) used for trust validation", function (done) {
			ssllabs.getRootCertsRaw({ trustStore: 5 }, function (err, rootCertsRaw) {
				if (err) {
					return done(err);
				}
				try {
					rootCertsRaw.should.be.ok;
					rootCertsRaw.should.be.a.String;
					rootCertsRaw.should.match(/Trust Store: Windows/);
					done();
				} catch (err) {
					console.log(rootCertsRaw);
					done(err);
				}
			});
		});

		it("should retrieve the root certificates used for trust validation", function (done) {
			ssllabs.getRootCerts(function (err, certs) {
				if (err) {
					return done(err);
				}
				try {
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
				} catch (err) {
					console.log(certs);
					done(err);
				}
			});
		});

		it("should invoke analyze and poll until the assessment is finished (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			var options = {
				host: "www.facebook.com",
				startNew: true
			};

			ssllabs.scan(options, function (err, host) {
				if (err) {
					done(err);
					return;
				}
				try {
					host.status.should.be.ok;
					host.status.should.equal("READY");
					host.endpoints.length.should.be.above(0);
					host.endpoints.forEach(function (endpoint) {
						endpoint.grade.should.be.ok;
						endpoint.grade.should.not.be.empty;
					});
					done();
				} catch (err) {
					console.log(host);
					done(err);
				}
			});
		});

		it("should scan a host by just specifying the hostname (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			ssllabs.scan("www.apple.com", function (err, host) {
				if (err) {
					done(err);
					return;
				}

				try {
					host.status.should.be.ok;
					host.status.should.equal("READY");
					host.endpoints.length.should.be.above(0);
					host.endpoints.forEach(function (endpoint) {
						endpoint.grade.should.be.ok;
						endpoint.grade.should.not.be.empty;
					});
					done();
				} catch (err) {
					console.log(host);
					done(err);
				}
			});
		});

		it("should scan a host with a Unicode domain name (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			ssllabs.scan("互联网中心.中国", function (err, host) {
				if (err) {
					done(err);
					return;
				}
				try {
					host.status.should.be.ok;
					host.status.should.equal("READY");
					host.endpoints.length.should.be.above(0);
					host.endpoints.forEach(function (endpoint) {
						endpoint.grade.should.be.ok;
						endpoint.grade.should.not.be.empty;
					});
					done();
				} catch (err) {
					console.log(host);
					done(err);
				}
			});
		});

		it("should scan two hosts in parallel (slow)", function (done) {
			this.timeout(20 * 60 * 1000);
			this.slow(2 * 60 * 1000);

			async.parallel([
				function (callback) {
					ssllabs.scan({host: "www.amazon.com", startNew: true}, function (err, host) {
						if (err) {
							callback(err);
						}
						try {
							host.status.should.be.ok;
							host.status.should.equal("READY");
							host.host.should.equal("www.amazon.com");
							callback(null, host);
						} catch (err) {
							console.log(host);
							callback(err);
						}
					});
				},
				function (callback) {
					ssllabs.scan("www.google.com", function (err, host) {
						if (err) {
							callback(err);
						}
						try {
							host.status.should.be.ok;
							host.status.should.equal("READY");
							host.host.should.equal("www.google.com");
							callback(null, host);
						} catch (err) {
							console.log(host);
							callback(err);
						}
					});
				}
			], done);
		});

	});

});
