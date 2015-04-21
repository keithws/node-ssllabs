/*jslint node: true */
/*jslint expr: true */
"use strict";

var should = require("should"),
	mocha = require("mocha"),
	ssllabs = require("../lib/ssllabs.js");

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
	});

});
