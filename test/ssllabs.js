/*jslint node: true */
/*jslint expr: true */
"use strict";

var should = require("should"),
	mocha = require("mocha"),
	ssllabs = require("../lib/ssllabs.js"),
	async = require("async");

var describe = mocha.describe,
	it = mocha.it;

describe("ssllabs", function () {

	describe("library", function () {

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
					"messages"
				]);
				info.currentAssessments.should.be.a.number;
				info.maxAssessments.should.be.a.number;
				info.messages.should.be.an.array;
				done();
			});
		});

		it("should invoke assessment", function(done) {
			var options;

			options = {
				all: "done",
				host: "ssllabs.com",
				publish: true,
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
				host: "ssllabs.com",
				publish: true
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
				host: "ssllabs.com",
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

		it("should invoke analyze and poll until the assessment is finished", function (done) {
			var options;

			this.timeout(2 * 60 * 1000);
			this.slow(60 * 1000);

			options = {
				host: "ssllabs.com",
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

		it("should scan a host by just specifing the hostname", function (done) {
			ssllabs.scan("ssllabs.com", function (err, host) {
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

		it("should scan two hosts in parallel", function (done) {
			async.parallel([
				function (callback) {
					ssllabs.scan("ssllabs.com", function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("ssllabs.com");
						callback(null, host);
					});
				},
				function (callback) {
					ssllabs.scan("feistyduck.com", function (err, host) {
						if (err) {
							callback(err, null);
						}
						host.status.should.be.ok;
						host.status.should.equal("READY");
						host.host.should.equal("feistyduck.com");
						callback(null, host);
					});
				}
			], done);
		});

		describe("analyze call", function () {

			it("should throw an error if startNew and fromCache are both true", function (done) {
				var options = {
					host: "ssllabs.com",
					startNew: true,
					fromCache: true
				};
				ssllabs.analyze.bind(null, options).should.throw("fromCache cannot be used at the same time as the startNew parameter.");
				done();
			});

			it("should throw an error if fromCache is specified but maxAge is not", function (done) {
				var options = {
					host: "ssllabs.com",
					fromCache: true
				};
				ssllabs.analyze.bind(null, options).should.throw();

				options = {
					host: "ssllabs.com",
					fromCache: true,
					maxAge: null
				};
				ssllabs.analyze.bind(null, options).should.throw();
				done();
			});

			it("should throw an error if maxAge parameter is not a positive integer", function (done) {
				var options = {
					host: "ssllabs.com",
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
				ssllabs.analyze.bind(null, options).should.not.throw();
				options.maxAge = 17532;
				ssllabs.analyze.bind(null, options).should.not.throw();
				done();
			});

			it("should throw an error if all parameter is not on, off, or done", function (done) {
				var options = {
					host: "ssllabs.com",
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
					host: "ssllabs.com",
					s: "127.0.0.1",
					publish: "on",
					startNew: "on",
					fromCache: "on",
					maxAge: "24",
					all: "done",
					ignoreMismatch: "on"
				};
				ssllabs.normalizeOptions(options).should.eql({
					host: "ssllabs.com",
					s: "127.0.0.1",
					publish: true,
					startNew: true,
					fromCache: true,
					maxAge: 24,
					all: "done",
					ignoreMismatch: true
				});
				options = {
					host: "ssllabs.com",
					s: "127.0.0.1",
					publish: "off",
					startNew: "off",
					fromCache: "off",
					maxAge: "24",
					all: "done",
					ignoreMismatch: "off"
				};
				ssllabs.normalizeOptions(options).should.eql({
					host: "ssllabs.com",
					s: "127.0.0.1",
					publish: false,
					startNew: false,
					fromCache: false,
					maxAge: 24,
					all: "done",
					ignoreMismatch: false
				});
				done();
			});
		});
	});

});
