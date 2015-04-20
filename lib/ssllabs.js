/*
 * node-ssllabs
 * Copyright(c) 2015 Keith Shaw <keith.w.shaw@gmail.com>
 * MIT Licensed
 */


/*
 * module dependencies
 */
var http = require("https"),
	url = require("url"),
	_ = require("underscore");


/*
 * module globals
 */
var api = {
	endPoint: {
		protocol: "https",
		slashes: true,
		host: "api.dev.ssllabs.com",
		pathname: "/api/v2/"
	},
	info: {
		criteriaVersion: null,
		currentAssessments: -Infinity,
		maxAssessments: Infinity,
		messages: [],
		version: null
	},
	statusCodes: {}
};


/*
 * helper functions
 */


/*
 * keep local copy of assement counts upto date by reading the values the
 * server send back in the header
 */
function updateAssessmentCounts(response) {
	api.info.currentAssessments = parseInt(
		response.headers["x-current-assessments"], 10);
	api.info.maxAssessments = parseInt(
		response.headers["x-max-assessments"], 10);
}


/*
 * convert options with boolean values to API parameters
 */
function optionsToParameters(options) {
	var parameters = {};

	_.each(options, function (value, key, list) {
		if (value === true) {
			parameters[key] = "on";
		} else if (value === false) {
			parameters[key] = "off";
		} else {
			parameters[key] = value;
		}
	});

	return parameters;
}


/*
 * Check SSL Labs availability
 */
exports.info = function (callback) {
	var apiUrl, body;

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "info";
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		if (response.statusCode !== 200) {
			callback(new Error("Unable to retrive info."), null);
		}

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		callback(e, null);

	}).on("close", function () {
		var info;

		try {
			info = JSON.parse(body);

			// save values from Info Object for later
			api.info = info;
		} catch (e) {
			callback(e, null);
		}

		callback(null, info);
	});
};


/*
 * Invoke assessment and check progress
 */
exports.analyze = function (options, callback) {
	var defaults, apiUrl, body;

	defaults = {
		publish: false,
		fromCache: false,
		ignoreMismatch: false
	};

	options = _.defaults(options, defaults);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "analyze";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		if (response.statusCode !== 200) {
			throw new Error("Unable to analyze host.");
		}

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		throw e;

	}).on("close", function () {
		var host;

		try {
			host = JSON.parse(body);
		} catch (e) {
			callback(e, null);
		}

		callback(null, host);
	});
};


/*
 * Retrieve detailed endpoint information
 */
exports.getEndpointData = function (options, callback) {
	var defaults, apiUrl, body;

	defaults = {
		fromCache: false
	};

	options = _.defaults(options, defaults);

	if (!options.host) {
		throw new Error("Host is required.");
	}

	if (!options.s) {
		throw new Error("Endpoint IP address is required.");
	}

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "getEndpointData";
	apiUrl.query = optionsToParameters(options);
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		if (response.statusCode !== 200) {
			console.log("STATUS: " + response.statusCode);
			throw new Error("Unable to get endpoint data.");
		}

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		throw e;

	}).on("close", function () {
		var endpointData;

		try {
			endpointData = JSON.parse(body);
		} catch (e) {
			callback(e, null);
		}

		callback(null, endpointData);
	});
};


/*
 * Retrieve known status codes
 */
exports.getStatusCodes = function (callback) {
	var apiUrl, body;

	apiUrl = _.clone(api.endPoint);
	apiUrl.pathname += "getStatusCodes";
	body = "";

	http.get(url.format(apiUrl), function(response) {

		updateAssessmentCounts(response);

		if (response.statusCode !== 200) {
			callback(new Error("Unable to retrieve known status codes."), null);
		}

		response.setEncoding("utf8");
		response.on("data", function (chunk) {
			body += chunk;
		});

	}).on("error", function(e) {

		callback(e, null);

	}).on("close", function () {
		var statusCodes;

		try {
			statusCodes = JSON.parse(body);

			// keep a copy of the status codes in the api object
			api.statusCodes = statusCodes;
		} catch (e) {
			callback(e, null);
		}

		callback(null, statusCodes);
	});
};
