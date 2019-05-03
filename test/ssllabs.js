/* eslint-env node, mocha */
"use strict";

require("should");
const ssllabs = require("../lib/ssllabs.js");
const async = require("async");

describe("ssllabs", function () {

	describe("library", function () {
		// because most of these tests wait for network responses
		this.timeout(1600);
		this.slow(400);

		it("should check SSL Labs availability", function (done) {
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
					throw err;
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

		it("should retrieve the root certificates used for trust validation", function (done) {
			ssllabs.getRootCertsRaw(function (err, rootCertsRaw) {
				if (err) {
					return done(err);
				}
				rootCertsRaw.should.be.ok;
				rootCertsRaw.should.be.a.String;
				done();
			});
		});

		it("should invoke analyze and poll until the assessment is finished (slow)", function (done) {
			var options;

			this.timeout(4 * 1.5 * 60 * 1000);
			this.slow(1.5 * 60 * 1000);

			options = {
				host: "feistyduck.com",
				startNew: true
			};

			ssllabs.scan(options, function (err, host) {
				if (err) {
					throw err;
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
			ssllabs.scan("www.ssllabs.com", function (err, host) {
				if (err) {
					throw err;
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
			this.timeout(4 * 60 * 1000);
			this.slow(60 * 1000);

			async.parallel([
				function (callback) {
					ssllabs.scan({host: "feistyduck.com", startNew: true}, function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("feistyduck.com");
						callback(null, host);
					});
				},
				function (callback) {
					ssllabs.scan("www.ssllabs.com", function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("www.ssllabs.com");
						callback(null, host);
					});
				}
			], done);
		});

		describe("analyze call", function () {
			// these test do not wait for network responses
			this.timeout(16);
			this.slow(4);

			it("should throw an error if startNew and fromCache are both true", function (done) {
				var options = {
					host: "feistyduck.com",
					startNew: true,
					fromCache: true
				};
				ssllabs.analyze.bind(null, options).should.throw("fromCache cannot be used at the same time as the startNew parameter.");
				done();
			});

			it("should throw an error if maxAge is specified but fromCache is not", function (done) {
				var options = {
					host: "www.ssllabs.com",
					maxAge: 24
				};
				ssllabs.analyze.bind(null, options).should.throw();

				options = {
					host: "www.ssllabs.com",
					fromCache: false,
					maxAge: 24
				};
				ssllabs.analyze.bind(null, options).should.throw();
				done();
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

		describe("options", function () {
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
	});

});
